angular.module('mastersApp', [])
  .controller('MastersController', ['$scope','$http', function($scope, $http) {
    var masters = this;

    masters.teams = [
      { owner: "Adam",
        players: ["Bryson DeChambeau","Xander Schauffele","Patrick Reed","Jason Day","Matthew Wolff","Justin Rose","Cameron Champ","Abraham Ancer"],
        scoresByRound: [[],[],[],[]],
        playerTotals: []
      },
      { owner: "Danny",
        players: ["Jon Rahm","Rory McIlroy","Bubba Watson","Patrick Cantlay","Tiger Woods","Jordan Spieth","Tyrrell Hatton","Matt Kuchar"],
        scoresByRound: [[],[],[],[]],
        playerTotals: []
      },
      { owner: "Drew",
        players: ["Dustin Johnson","Brooks Koepka","Hideki Matsuyama","Adam Scott","Rickie Fowler","Kevin Kisner","Paul Casey","Shane Lowry"],
        scoresByRound: [[],[],[],[]],
        playerTotals: []
      },
      { owner: "Ryan",
        players: ["Justin Thomas","Webb Simpson","Collin Morikawa","Tony Finau","Tommy Fleetwood","Louis Oosthuizen","Sungjae Im","Matthew Fitzpatrick"],
        scoresByRound: [[],[],[],[]],
        playerTotals: []
      }
    ];

    masters.pools = {
      round1LowMan: [],
      round1LowFoursome: [],
      round2LowMan: [],
      round2LowFoursome: [],
      round3LowMan: [],
      round3LowFoursome: [],
      round4LowMan: [],
      round4LowFoursome: [],
      LowTournamentFoursome: []
    };

    function calculateScore(pars,roundData) {
      var score = 0;
      for (var i = 0; i < 18; i++){
        if (roundData[i] != null){
          score = score + (roundData[i] - pars[i]);
        }
      }
      return score;
    }

    function findPlayerWithScore(team, round, score){
      var player = "";
      var roundScores = team.scoresByRound[round];
      for (var i = 0; i < roundScores.length; i++){
        var scoreInRound = roundScores[i];
        if (score == scoreInRound){
          player = team.players[i];
          break;
        }
      }
      return player;
    }

    function getFoursomeForScores(team, round, scores){
      var players = [];
      var roundScores = team.scoresByRound[round];
      for (var j = 0; j < scores.length; j++){
        var score = scores[j];
        for (var i = 0; i < roundScores.length; i++){
          var scoreInRound = roundScores[i];
          if (score == scoreInRound && (players.indexOf(team.players[i]) < 0)){
            players.push(team.players[i] + " " + score.toString());
            break;
          }
        }
      }
      return players;
    }

      $http.get("https://www.masters.com/en_US/scores/feeds/scores.json")
      .then(function(response){
        var mastersData = response.data.data;
        for (var i = 0; i < masters.teams.length; i++){
          var team = masters.teams[i];
          for (var j = 0; j < team.players.length;j++){
            var playerName = team.players[j];
            for (var k = 0; k < mastersData.player.length; k++){
              var playerData = mastersData.player[k];
              if ((playerData.first_name + " " + playerData.last_name) === playerName){
                var scores = [calculateScore(mastersData.pars.round1,playerData.round1.scores),
                  calculateScore(mastersData.pars.round1,playerData.round2.scores),
                  calculateScore(mastersData.pars.round1,playerData.round3.scores),
                  calculateScore(mastersData.pars.round1,playerData.round4.scores)];
                  var playerTotal = 0;
                  for (var l = 0; l < 4; l++){
                    var roundScore = scores[l];
                    playerTotal = playerTotal + roundScore;
                    team.scoresByRound[l].push(roundScore);
                  }
                  team.playerTotals.push(playerTotal);
                break;
              } else if (k === mastersData.player.length){
                console.log("Player not found: " + playerName);
              }
            }
          }
        }
        
        for (var i = 0; i < masters.teams.length; i++){
          var team = masters.teams[i];
          for (var j = 0; j < 4; j++){
            var scoresForRound = team.scoresByRound[j].slice();
            var scoresForRoundSorted = scoresForRound.sort(function(a,b){return a - b});
            masters.pools["round" + (j+1) + "LowMan"].push({team: team.owner, score: scoresForRoundSorted[0], player: findPlayerWithScore(team, j, scoresForRoundSorted[0])});
            var foursomePlayers = getFoursomeForScores(team, j, [scoresForRoundSorted[0],scoresForRoundSorted[1],scoresForRoundSorted[2],scoresForRoundSorted[3]]);
            masters.pools["round" + (j+1) + "LowFoursome"].push({team: team.owner, score: scoresForRoundSorted[0] + scoresForRoundSorted[1] + scoresForRoundSorted[2] + scoresForRoundSorted[3], players: foursomePlayers});
          }
          var playerTotalsSorted = team.playerTotals.sort(function(a,b){return a - b});
          masters.pools.LowTournamentFoursome.push({team: team.owner, score: playerTotalsSorted[0] + playerTotalsSorted[1] + playerTotalsSorted[2] + playerTotalsSorted[3]});
        }

        for (var i = 0; i < 4; i++){
          masters.pools["round" + (i+1) + "LowMan"].sort(function(a,b){return a.score - b.score});
          masters.pools["round" + (i+1) + "LowFoursome"].sort(function(a,b){return a.score - b.score});
        }

        masters.pools.LowTournamentFoursome.sort(function(a,b){return a.score - b.score});
      });
    }
  ]);