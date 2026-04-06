const { Router } = require("express");
const urlRouter = Router();
const { userauthmiddleware } = require("../middleware/user")
const { cfModel, ccModel, lcModel, userModel } = require("../db");
const { z, url } = require("zod");
const { set } = require("mongoose");
const puppeteer = require('puppeteer');

async function getrating(convertedresult) {
    let maxrating = 0;
    const contests = convertedresult.result;
    for (let i = 0; i < contests.length; i++) {
        maxrating = Math.max(maxrating, parseInt(contests[i].newRating))
    }
    return [maxrating, parseInt(contests[contests.length - 1].newRating)];
}
async function countquestion(submissions) {
    const set = new Set();
    for (const s of submissions) {
        if (s?.verdict === "OK" && s.problem?.contestId && s.problem?.index) {
            set.add(`${s.problem.contestId}-${s.problem.index}`);
        }
    }
    return set.size;
}
async function getcfpoints(submissions) {
    let points = 0;
    const solved = new Set();
    for (const s of submissions) {
        if (!s.verdict || s.verdict !== "OK") continue;
        const pid = (s.problem.contestId ? s.problem.contestId + "-" : "") + (s.problem.index ?? "") + "-" + (s.problem.name ?? "");
        if (solved.has(pid)) continue;
        solved.add(pid);
        const r = s.problem.rating;
        if (typeof r !== "number") continue;
        if (r >= 800 && r <= 1200) points += 1;
        else if (r > 1200 && r <= 1400) points += 2;
        else if (r > 1400) points += 3;
    }
    return points;
}
async function getccdata(cc_url) {

    const toNum = t => {
        const m = String(t || '').match(/\d+/);
        return m ? Number(m) : null;
    };
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.codechef.com/users/${cc_url}`, {
        waitUntil: 'networkidle2'
    });

    const rating = await page.$eval('.rating-number', el => el.innerText);
    const max_rating = await page.$eval('.rating-header small', el => el.innerText);
    const problems = await page.$eval('body > main > div > div > div > div > div > section.rating-data-section.problems-solved > h3:nth-child(31)', el => el.innerText);
    const contests = await page.$eval('body > main > div > div > div > div > div > section.rating-data-section.problems-solved > h3:nth-child(5)', el => el.innerText);
    await browser.close();
    return ([toNum(rating), toNum(max_rating), toNum(problems), toNum(contests)]);

}
async function getLeetCodeStats(username) {
    const GRAPHQL_URL = 'https://leetcode.com/graphql/';

    async function graphqlRequest(query, variables = {}) {
        const res = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'referer': 'https://leetcode.com'
            },
            body: JSON.stringify({ query, variables })
        });

        const json = await res.json();
        if (json.errors) throw new Error(JSON.stringify(json.errors));
        return json.data;
    }

    const query = `
    query getLeetCodeStats($username: String!) {
      user: matchedUser(username: $username) {
        stats: submitStatsGlobal {
          accepted: acSubmissionNum {
            difficulty
            count
          }
        }
      }
      currentRank: userContestRanking(username: $username) {
        contests: attendedContestsCount
        rating
      }
      history: userContestRankingHistory(username: $username) {
        rating
      }
    }`;

    const d = await graphqlRequest(query, { username });

    const totalSolved = d?.user?.stats?.accepted?.find(x => x.difficulty === 'All')?.count ?? 0;
    const easysolved = d?.user?.stats?.accepted?.find(x => x.difficulty === 'Easy')?.count ?? 0;
    const mediumsolved = d?.user?.stats?.accepted?.find(x => x.difficulty === 'Medium')?.count ?? 0;
    const hardsolved = d?.user?.stats?.accepted?.find(x => x.difficulty === 'Hard')?.count ?? 0;
    const currentRating = d?.currentRank?.rating ?? null;
    const contests = d?.currentRank?.contests ?? 0;
    const points = easysolved + mediumsolved * 2 + hardsolved * 3;
    const ratings = Array.isArray(d?.history)
        ? d.history.map(h => h?.rating).filter(r => typeof r === 'number')
        : [];
    const maxRating = ratings.length ? Math.max(...ratings) : null;

    return {
        totalQuestionsSolved: totalSolved,
        currentContestRating: currentRating,
        maxContestRating: maxRating,
        attendedContests: contests,
        points: points
    };

}
urlRouter.post("/cfurl", userauthmiddleware, async (req, res) => {
    const requirebody = z.object({
        cf_url: z.string()
    })
    const parseddatawithsuccess = requirebody.safeParse(req.body);
    if (!parseddatawithsuccess.success) {
        res.json({
            message: "incorrect format",
            error: parseddatawithsuccess.error
        })
        return
    }
    const { cf_url } = req.body;
    const userId = req.userId;

    const [result, quescount] = await Promise.all([
        fetch(`https://codeforces.com/api/user.rating?handle=${cf_url}`),
        fetch(`https://codeforces.com/api/user.status?handle=${cf_url}&from=1&count=100000`)
    ]);
    const [convertedresult, convertedquescount] = await Promise.all([result.json(), quescount.json()]);
    const totalques = await countquestion(convertedquescount.result);
    const cf_points = await getcfpoints(convertedquescount.result)
    const cf_contest = convertedresult.result.length;
    const [cf_maxrating, cf_currentrating] = await getrating(convertedresult);
    try {
        const user = await cfModel.findOne({
            userId: userId
        })
        //user upadate userhandle
        if (user && user.cf_url != cf_url) {
            await cfModel.updateOne(
                { userId: userId },
                { $set: { cf_url: cf_url } }
            )
            res.json({
                msg: "username updated"
            })
        }
        //user first inputes handle
        else {
            if (!user) {
                await cfModel.create({
                    userId: userId,
                    cf_url: cf_url,
                    cf_contest: cf_contest,
                    cf_maxrating: cf_maxrating,
                    cf_currentrating: cf_currentrating,
                    cf_questionNo: totalques,
                    cf_points: cf_points
                })
                res.json({
                    msg: "url added"
                })
            }
            else {
                res.status(403).json({
                    msg: "objectId already exist"
                })
            }
        }
    } catch (e) {
        res.status(403).json({
            msg: e
        })
    }
})
urlRouter.post("/ccurl", userauthmiddleware, async (req, res) => {
    const requirebody = z.object({
        cc_url: z.string()
    })
    const parseddatawithsuccess = requirebody.safeParse(req.body);
    if (!parseddatawithsuccess.success) {
        res.json({
            message: "incorrect format",
            error: parseddatawithsuccess.error
        })
        return
    }
    const { cc_url } = req.body;
    const userId = req.userId;

    const [cc_currentrating, cc_maxrating, cc_questionNo, cc_contest] = await getccdata(cc_url);


    try {
        const user = await ccModel.findOne({
            userId: userId
        })
        //user upadate userhandle
        if (user && user.cc_url != cc_url) {
            await ccModel.updateOne(
                { userId: userId },
                { $set: { cc_url: cc_url } }
            )
            res.json({
                msg: "username updated"
            })
        }
        //user first inputes handle
        else {
            if (!user) {
                await ccModel.create({
                    userId: userId,
                    cc_url: cc_url,
                    cc_contest: cc_contest,
                    cc_currentrating: cc_currentrating,
                    cc_maxrating: cc_maxrating,
                    cc_questionNo: cc_questionNo,
                    cc_points: cc_questionNo * 2
                })
                res.json({
                    msg: "url added"
                })
            }
            else {
                res.status(403).json({
                    msg: "objectId already exist"
                })
            }
        }
    } catch (e) {
        res.status(403).json({
            msg: e
        })
    }
})
urlRouter.post("/lcurl", userauthmiddleware, async (req, res) => {
    const requirebody = z.object({
        lc_url: z.string()
    })
    const parseddatawithsuccess = requirebody.safeParse(req.body);
    if (!parseddatawithsuccess.success) {
        res.json({
            message: "incorrect format",
            error: parseddatawithsuccess.error
        })
        return
    }
    const { lc_url } = req.body;
    const userId = req.userId;


    try {

        const result = await getLeetCodeStats(lc_url);



        const [lc_questionNo, lc_currentrating, lc_maxrating, lc_contest, lc_points] = [result.totalQuestionsSolved, result.currentContestRating, result.maxContestRating, result.attendedContests, result.points]


        const user = await lcModel.findOne({
            userId: userId
        })
        //user update userhandle
        if (user && user.lc_url != lc_url) {
            await lcModel.updateOne(
                { userId: userId },
                { $set: { lc_url: lc_url } }
            )
            res.json({
                msg: "username updated"
            })
        }
        //user first inputes handle
        else {
            if (!user) {
                await lcModel.create({
                    userId: userId,
                    lc_url: lc_url,
                    lc_contest: lc_contest,
                    lc_maxrating: lc_maxrating,
                    lc_currentrating: lc_currentrating,
                    lc_questionNo: lc_questionNo,
                    lc_points: lc_points,
                })
                res.json({
                    msg: "url added"
                })
            }
            else {
                res.status(403).json({
                    msg: "objectId already exist"
                })
            }
        }
    } catch (e) {
        res.status(403).json({
            msg: e
        })
    }


})
urlRouter.get("/getdata", userauthmiddleware, async (req, res) => {
    const targetuser=req.query.userId||req.userId;
    const cfuser = await cfModel.findOne({
        userId: targetuser,
    })

    const ccuser = await ccModel.findOne({
        userId: targetuser,
    })

    const lcuser = await lcModel.findOne({
        userId: targetuser,
    })
    let cf_points = 0, cc_points = 0, lc_points = 0;
    if (cfuser != null) {
        const result = await fetch(`https://codeforces.com/api/user.rating?handle=${cfuser.cf_url}`)
        const quescount = await fetch(`https://codeforces.com/api/user.status?handle=${cfuser.cf_url}&from=1&count=100000`)
        const convertedquescount = await quescount.json();
        const convertedresult = await result.json();
        cf_points = await getcfpoints(convertedquescount.result);
        await cfModel.updateOne(
            { userId: targetuser },
            { $set: { cf_contest: convertedresult.result.length, cf_maxrating: (await getrating(convertedresult))[0], cf_currentrating: (await getrating(convertedresult))[1], cf_questionNo: await countquestion(convertedquescount.result), cf_points: cf_points } }
        )
    }

    if (ccuser != null) {
        const [cc_currentrating, cc_maxrating, cc_questionNo, cc_contest] = await getccdata(ccuser.cc_url);
        cc_points = 2 * cc_questionNo;
        await ccModel.updateOne(
            { userId: targetuser },
            { $set: { cc_contest: cc_contest, cc_maxrating: cc_maxrating, cc_currentrating: cc_currentrating, cc_questionNo: cc_questionNo, cc_points: cc_points } }
        )
    }
    if (lcuser != null) {
        const lcresult = await getLeetCodeStats(lcuser.lc_url);
        lc_points = lcresult.points;

        await lcModel.updateOne(
            { userId:targetuser},
            {
                $set: {
                    lc_contest: lcresult.attendedContests,
                    lc_maxrating: lcresult.maxContestRating,
                    lc_currentrating: lcresult.currentContestRating,
                    lc_questionNo: lcresult.totalQuestionsSolved,
                    lc_points: lc_points,
                }
            }
        );
    }

    await userModel.updateOne(
        { _id: targetuser },
        { $set: { points: lc_points +cc_points+ cf_points } }

    )
    const updateduser1 = await lcModel.findOne({
        userId: targetuser,
    })
    const updateduser2 = await ccModel.findOne({
        userId: targetuser,
    })
    const updateduser3 = await cfModel.findOne({
        userId: targetuser,
    })

    res.json({
        lc: (updateduser1 == null ? null : updateduser1),
        cc: (updateduser2 == null ? null : updateduser2),
        cf: (updateduser3 == null ? null : updateduser3)
    });


})
urlRouter.get("/getname", userauthmiddleware, async (req, res) => {
  try {
    const id = req.query.id || req.body?.id || req.userId;
    if (!id) return res.status(400).json({ error: "Missing user id" });

    const user = await userModel.findById(id).select("name");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ name: user.name });
  } catch (err) {
    console.error("getname error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

urlRouter.get("/leaderboard", userauthmiddleware, async (req, res) => {
    try {
        const userspoints = await userModel.find({}, { name: 1, points: 1, _id: 0 }).sort({ points: -1 });
        const usercc=await ccModel.find({}, { userId: 1,cc_currentrating: 1, _id: 0 }).sort({ cc_currentrating: -1 });
        const userlc=await lcModel.find({}, { userId: 1,lc_currentrating: 1, _id: 0 }).sort({ lc_currentrating: -1 });
        const usercf=await cfModel.find({}, { userId: 1,cf_currentrating: 1, _id: 0 }).sort({ cf_currentrating: -1 });
        
        res.status(200).json({
            userleaderboard: userspoints,
            ccleaderboard:usercc,
            lcleaderboard:userlc,
            cfleaderboard:usercf
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            msg: "Error fetching leaderboard",
            error: err.message
        });
    }
});


urlRouter.post("/addfriend", userauthmiddleware, async (req, res) => {
    const user = await userModel.findOne({
        name: req.body.name,
    })
    await userModel.updateOne(
        { _id: req.userId },
        { $push: { friends: user._id } }
    )
    res.json({
        msg:"added",
    })


});

urlRouter.get("/getfriends", userauthmiddleware, async (req, res) => {
    const currentuser = await userModel.findOne({
        _id: req.userId,
    })
    const friendsdata = [];
    for (let i = 0; i < currentuser.friends.length; i++) {
        const friend = await userModel.findOne({
            _id: currentuser.friends[i],
        })
        friendsdata.push({
            name: friend.name,
        })
    }
    res.json({
        friends: friendsdata,
    })

});
urlRouter.post("/checkfriend", userauthmiddleware, async (req, res) => {
    const friend=await userModel.findOne({
        name:req.body.name,
    })
    const currentuser=await userModel.findOne({
        _id:req.userId,
    })
    if(currentuser.friends.includes(friend._id)){
        res.json({
            msg:true
        })
    }
    else{
        res.json({
            msg:false
        })
    }
    
});
urlRouter.delete("/removefriend", userauthmiddleware, async (req, res) => {
    const friend=await userModel.findOne({
        name:req.body.name,
    })
    await userModel.updateOne(
        { _id: req.userId },
        { $pull: { friends: friend._id} }
    )
    res.json({
        msg:"deleted"
    })

});
urlRouter.post("/viewprofile",userauthmiddleware,async (req,res)=>{
    const user=await userModel.findOne({
        name:req.body.name,
    });
    const data=await fetch(`http://localhost:${process.env.PORT}/url/getdata?userId=${user._id}`,{
        method:"GET",
        headers: {
        "token": req.headers.token, 
      },
        
    });
    const convereteddata=await data.json();
    res.json({
        ...convereteddata
    })
})
module.exports = {
    urlRouter: urlRouter
}
