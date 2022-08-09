const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDb = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDb();

const convertPlayerDetailsDbObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `SELECT * FROM player_details`;
  const playerArray = await database.all(getPlayerQuery);
  response.send(playerArray.map((each) => convertPlayerDetailsDbObject(each)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSqlQuery = `SELECT * FROM player_details WHERE player_id=${playerId}`;
  const player = await database.get(getSqlQuery);
  response.send(convertPlayerDetailsDbObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const AddSqlQuery = `UPDATE player_details SET player_name='${playerName} 
    WHERE player_id=${playerId}'`;
  await database.run(AddSqlQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchSqlQuery = `SELECT * FROM match_details WHERE match_id=${matchId}`;
  const match = await database.get(matchSqlQuery);
  response.send(convertMatchDetailsDbObject(match));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_match_score 
    NATURAL JOIN  match_details WHERE player_id=${playerId}`;
  const playerMatch = await database.all(getPlayerQuery);
  response.send(playerMatch.map((each) => convertMatchDetailsDbObject(each)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `SELECT * FROM player_match_score 
    NATURAL JOIN player_details
    WHERE match_id=${matchId}`;
  const playersArray = await database.all(getMatchPlayerQuery);
  response.send(playersArray.map((each) => convertPlayerDetailsDbObject(each)));
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerSqlQuery = `SELECT player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    Sum(sixes) AS totalSixes,
    FROM player_match_score 
    NATURAL JOIN player_details 
    WHERE player_id=${playerId}`;
  const matchPlayer = await database.get(getMatchPlayerSqlQuery);
  response.send(matchPlayer);
});

module.exports = app;
