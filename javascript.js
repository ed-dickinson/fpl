let players,
    teams,
    gameweek

let gameweeks = []

let dom = {
  teams : document.querySelector('#teams')
}

let fetchedGameweeks = []

async function getGameweek(gw) {

  const response = await fetch('https://cors-anywhere.herokuapp.com/' + `https://fantasy.premierleague.com/api/event/${gw}/live/`, {
    mode: 'cors',
    headers: {
    }
  });
  const data = await response.json();

  console.log('gameweek:', gw, data)

  // gameweek is an array of players with .id(i+1?) and .stats.total_points and .explain array [{fixture, stats[{}]}]

  return data;

}

async function getGameweeks() {
  let wait_on = []
  for (let i = 0; i < lookback; i++) {

    if (!fetchedGameweeks[gameweek - i]) {
      console.log('no gameweek')
      // fetchedGameweeks[gameweek - i] = getGameweek(gameweek - i)
      wait_on.push(getGameweek(gameweek - i))
      // wait_on.push[fetchedGameweeks[gameweek - i]]
    }
  }
  let fetched = await Promise.all(wait_on)

  fetched.forEach(fetch => {
    let i = fetched.indexOf(fetch)
    fetchedGameweeks[gameweek - i] = fetched[i]

  })

  if (fetched) {
    console.log(fetchedGameweeks)
    recalcPlayers()
  }

  console.log(fetched)
}

async function getGeneral() {

  const response = await fetch('https://cors-anywhere.herokuapp.com/' + 'https://fantasy.premierleague.com/api/bootstrap-static/', {
    mode: 'cors',
    headers: {
    }
  });
  const data = await response.json();

  console.log(data)

  players = data.elements
  tabulatePlayers(players)

  teams = data.teams
  tabulateTeams(teams)

  let epoch = new Date().getTime()
  data.events.forEach(week => {
    if (week.deadline_time_epoch * 1000 < epoch) {gameweek = week.id}
  })
  document.querySelector('#gameweek').innerHTML = gameweek

  getGameweeks()

  return data;

} getGeneral()

const tabulateTeams = () => {
  console.log(teams)

  teams[11].strength -= 1 //liverpool
  teams[13].strength += 1 //manu
  teams[14].strength += 1 //newc

  teams.forEach(team => {
    dom.teams.children[0].innerHTML += `<tr><td>${team.name}</td><td>${team.strength}</td></tr>`
  })
}

const tabulatePlayers = () => {
  console.log('tabulate:',players)

  // clear table
  document.querySelector('#players table tbody').innerHTML = ''

  let sorted_players = players

  sorted_players.sort(function(a, b){return b.recent_points-a.recent_points});

  if (position_filter !== 0) {
    sorted_players = sorted_players.filter(x => {return x.element_type === position_filter});
  }
  // players.forEach(player => {
  for (let i = 0; i < 20; i++) {
    let player = sorted_players[i]
    document.querySelector('#players table tbody').innerHTML += `<tr>
      <td>${player.web_name}</td>
      <td>${['G','D','M','F'][player.element_type-1]}</td>
      <td>${player.total_points}</td>
      <td>${player.form}</td>
      <td>${player.selected_by_percent}%</td>
      <td>£${player.now_cost / 10}</td>
      <td>${player.recent_points ? player.recent_points : 'Ø'}</td>
      <td>${player.news!== '' ? '!' : ' '} ${player.news}</td>
    </tr>`

  }
}



const recalcPlayers = () => {
  players.forEach(player => {
    // console.log(player)
    player.recent_points = 0
  })
  for (let i = 0; i < lookback; i++) {
    // console.log(fetchedGameweeks[gameweek - i])
    fetchedGameweeks[gameweek - i].elements.forEach(player => {
      // console.log(player)
      // players[player.id - 1].recent_points += player.stats.total_points
      players.find(x => x.id === player.id).recent_points += player.stats.total_points
    })
  }

  tabulatePlayers()
}

// const retrigger = () => {
//
// }




let lookback = 4

dom.lookback = document.querySelector('#lookback-selector')

const changeLookback = (i) => {
  if (lookback === 1 || lookback === gameweek) {return}
  else {
    lookback += i
    dom.lookback.querySelector('span').textContent = lookback
  }
  if (!fetchedGameweeks[gameweek - lookback]) {
    getGameweeks()
  } else {
    recalcPlayers()
  }
  //
}
changeLookback(0)

dom.lookback.querySelector('button:first-of-type').addEventListener('click', ()=>{
  changeLookback(-1)
})
dom.lookback.querySelector('button:nth-of-type(2)').addEventListener('click', ()=>{
  changeLookback(1)
})



let position_filter = 0

dom.position_selector = document.querySelector('#position-selector')

const changePosFilt = () => {

}

for (let i = 0; i <= 4; i++) {
  let button = document.querySelectorAll('#position-selector button')[i]
  button.addEventListener('click', ()=>{
    console.log(i)
    position_filter = i
    tabulatePlayers()
    if (document.querySelector('#position-selector .selected')) {
      document.querySelector('#position-selector .selected').classList.remove('selected')
    }
    button.classList.add('selected')
  })
}
