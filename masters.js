angular.module('mastersApp', [])
  .controller('MastersController', ['$scope','$http', '$interval', function($scope, $http, $interval) {
    var masters = this;

    masters.init = function(){
      masters.updateTime = "";
      masters.teams = [
        { owner: "Adam",
          players: ["Rory McIlroy","Jon Rahm","Viktor Hovland","Scottie Scheffler","Tommy Fleetwood","Jason Day","Kevin Kisner","Max Homa"],
          scoresByRound: [[],[],[],[]],
          playerTotals: []
        },
        { owner: "Danny",
          players: ["Justin Thomas","Jordan Spieth","Patrick Reed","Lee Westwood","Brooks Koepka","Hideki Matsuyama","Corey Conners","Marc Leishman"],
          scoresByRound: [[],[],[],[]],
          playerTotals: []
        },
        { owner: "Drew",
          players: ["Bryson DeChambeau","Patrick Cantlay","Daniel Berger","Tony Finau","Louis Oosthuizen","Cameron Smith","Sungjae Im","Bubba Watson"],
          scoresByRound: [[],[],[],[]],
          playerTotals: []
        },
        { owner: "Ryan",
          players: ["Dustin Johnson","Collin Morikawa","Xander Schauffele","Paul Casey","Webb Simpson","Matthew Fitzpatrick","Abraham Ancer","Sergio Garcia"],
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
          if (score == scoreInRound && (players.indexOf(team.players[i] + " " + score.toString()) < 0)){
            players.push(team.players[i] + " " + score.toString());
            break;
          }
        }
      }
      return players;
    }

    masters.calculate = function() {
        $http.get("https://www.masters.com/en_US/scores/feeds/2021/scores.json")
        .then(function(response){
          masters.init();
          var mastersData = response.data.data;
          for (var i = 0; i < masters.teams.length; i++){
            var team = masters.teams[i];
            for (var j = 0; j < team.players.length;j++){
              var playerName = team.players[j];
              for (var k = 0; k < mastersData.player.length; k++){
                var playerData = mastersData.player[k];
                if ((playerData.first_name + " " + playerData.last_name).toLowerCase() === playerName.toLowerCase()){
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
                    team.playerTotals.push({player: playerName, score: playerTotal});
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
            var playerTotalsSorted = team.playerTotals.sort(function(a,b){return a.score - b.score});
            var playersTotalPlayers = [playerTotalsSorted[0].player + " " + playerTotalsSorted[0].score.toString(),playerTotalsSorted[1].player + " " + playerTotalsSorted[1].score.toString(), playerTotalsSorted[2].player + " " + playerTotalsSorted[2].score.toString(), playerTotalsSorted[3].player + " " + playerTotalsSorted[3].score.toString()];
            masters.pools.LowTournamentFoursome.push({team: team.owner, score: playerTotalsSorted[0].score + playerTotalsSorted[1].score + playerTotalsSorted[2].score + playerTotalsSorted[3].score,players: playersTotalPlayers});
          }

          for (var i = 0; i < 4; i++){
            masters.pools["round" + (i+1) + "LowMan"].sort(function(a,b){return a.score - b.score});
            masters.pools["round" + (i+1) + "LowFoursome"].sort(function(a,b){return a.score - b.score});
          }

          masters.pools.LowTournamentFoursome.sort(function(a,b){return a.score - b.score});
          masters.updateTime = (new moment()).format('MMM DD, YYYY hh:mm:ss A');
        });
      };
      masters.init();
      masters.calculate();
      $interval(masters.calculate,30000);
    }
  ]);