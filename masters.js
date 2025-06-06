angular.module('mastersApp', [])
  .controller('MastersController', ['$scope','$http', '$interval', function($scope, $http, $interval) {
    var masters = this;

    masters.init = function(){
      masters.updateTime = "";
      masters.teams = [
        { owner: "Candy",
          players: ["Scottie Scheffler",
                    "Brooks Koepka",
                    "Tommy Fleetwood",
                    "Patrick Cantlay",
                    "Min Woo Lee",
                    "Jason Day",
                    "Wyndham Clark",
                    "Keegan Bradley"],
          scoresByRound: [[],[],[],[]],
          playerTotals: []
        },
        { owner: "Adam",
          players: ["Collin Morikawa",
                    "Joaquín Niemann",
                    "Will Zalatoris",
                    "Corey Conners",
                    "Tyrrell Hatton",
                    "Sepp Straka",
                    "Tony Finau",
                    "Billy Horschel"],
          scoresByRound: [[],[],[],[]],
          playerTotals: []
        },
        { owner: "Abby",
          players: ["Rory McIlroy",
                    "Joe Highsmith",
                    "Adam Scott",
                    "Akshay Bhatia",
                    "Maverick McNealy",
                    "Taylor Pendrith",
                    "Stephan Jaeger",
                    "Jhonattan Vegas"],
          scoresByRound: [[],[],[],[]],
          playerTotals: []
        },
        { owner: "Fred",
          players: ["Bryson DeChambeau",
                    "Viktor Hovland",
                    "Phil Mickelson",
                    "Sergio Garcia",
                    "Thomas Detry",
                    "Dustin Johnson",
                    "Tom Kim",
                    "Fred Couples"],
          scoresByRound: [[],[],[],[]],
          playerTotals: []
        },
        { owner: "Danny",
          players: ["Xander Schauffele",
                    "Ludvig Åberg",
                    "Jordan Spieth",
                    "Hideki Matsuyama",
                    "Matt Fitzpatrick",
                    "Patrick Reed",
                    "Cameron Young",
                    "Justin Rose"],
          scoresByRound: [[],[],[],[]],
          playerTotals: []
        },
        { owner: "Ryan",
          players: ["Justin Thomas",
                    "Jon Rahm",
                    "Robert MacIntyre",
                    "Shane Lowry",
                    "Russell Henley",
                    "Cameron Smith",
                    "J.J. Spaun",
                    "Daniel Berger"],
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

    function calculateScore(pars,roundData, playerStatus, roundNumber) {
    	if ((playerStatus === "C") && (roundNumber === 3 || roundNumber === 4)){
    		return 1000;
    	}
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
        $http.get("https://www.masters.com/en_US/scores/feeds/2025/scores.json")
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
                  var scores = [calculateScore(mastersData.pars.round1,playerData.round1.scores, playerData.status,1),
                    calculateScore(mastersData.pars.round1,playerData.round2.scores, playerData.status,2),
                    calculateScore(mastersData.pars.round1,playerData.round3.scores, playerData.status,3),
                    calculateScore(mastersData.pars.round1,playerData.round4.scores, playerData.status,4)];
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