let players,
    teams,
    gameweek,
    fixtures

let gameweeks = []

let dom = {
  teams : document.querySelector('#teams')
}

const storeGameweek = (gw, array) => {
  localStorage.setItem('gameweek' + gw, JSON.stringify(array))
  // console.log('stored gw', gw)
}
const checkGameweekStorage = (gw) => {
  let ls = 0
  // maybe change this from always getting the most recent gameweek as it could change
  for (let i = 0; i <= gw; i++) {
    let retrieval = localStorage.getItem('gameweek' + i)

    if (retrieval !== null) {
      // console.log(retrieval)
      fetchedGameweeks[i] = JSON.parse(retrieval)
      ls++
    }
  }

  console.log(ls, 'weeks were retrieved from localStorage')
}

let fetchedGameweeks = []

async function getGameweek(gw) {

  const response = await fetch('https://cors-anywhere.herokuapp.com/' + `https://fantasy.premierleague.com/api/event/${gw}/live/`, {
    mode: 'cors',
    headers: {
    }
  });
  const data = await response.json();

  console.log('got gameweek:', gw, data)

  // gameweek is an array of players with .id(i+1?) and .stats.total_points and .explain array [{fixture, stats[{}]}]

  storeGameweek(gw, data)

  return data;

}

async function getGameweeks() {

  let wait_on = []
  let wait_on_index = []
  for (let i = 0; i < lookback; i++) {

    if (!fetchedGameweeks[gameweek - i]) {
      document.querySelector('#loading-indicator').classList.add('loading')

      // fetchedGameweeks[gameweek - i] = getGameweek(gameweek - i)
      wait_on.push(getGameweek(gameweek - i))
      wait_on_index.push(gameweek - i)
      // wait_on.push[fetchedGameweeks[gameweek - i]]
      console.log('waiting on...', wait_on.length, wait_on)
    }
  }
  let fetched = await Promise.all(wait_on)

  fetched.forEach(fetch => {
    let i = fetched.indexOf(fetch)

    fetchedGameweeks[wait_on_index[i]] = fetched[i]

  })

  if (fetched) {
    // console.log(fetchedGameweeks)
    recalcPlayers()

    document.querySelector('#loading-indicator').classList.remove('loading')
  } else {
    console.log('failed fetch')
    document.querySelector('#loading-indicator').classList.remove('loading')
  }

  console.log(fetched)
}

async function getGeneral() {

  document.querySelector('#loading-indicator').classList.add('loading')

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

  checkGameweekStorage(gameweek) // checks local storage
  getGameweeks()

  return data;

} getGeneral()



async function getFixtures() {

  // document.querySelector('#loading-indicator').classList.add('loading')

  let retrieval = localStorage.getItem('fixtures')

  if (retrieval !== null && retrieval !== 'undefined') {
    console.log('fixtures retrieved from local Storage', retrieval)
    fixtures = JSON.parse(retrieval)
    return
  }

  const response = await fetch('https://cors-anywhere.herokuapp.com/' + 'https://fantasy.premierleague.com/api/fixtures/', {
    mode: 'cors',
    headers: {
    }
  });
  const data = await response.json();

  console.log('fixtures:', data)

  fixtures = data
  // tabulatePlayers(players)
  //
  // teams = data.teams
  // tabulateTeams(teams)

  localStorage.setItem('fixtures', JSON.stringify(data))

  recalcPlayers()
  console.log('recalc with fixt')

  return data;

} getFixtures()



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
  for (let i = 0; i < list_amount; i++) {
    let player = sorted_players[i]
    document.querySelector('#players table tbody').innerHTML += `<tr>
      <td>${player.web_name}</td>
      <td>${['G','D','M','F'][player.element_type-1]}</td>
      <td>${player.total_points}</td>
      <td>${player.form}</td>
      <td>${player.selected_by_percent}%</td>
      <td>??${player.now_cost / 10}</td>
      <td>${player.recent_points ? player.recent_points : '??'}</td>
      <td>${player.adjusted_points ? player.adjusted_points : '??'}</td>
      <td>${player.predicted_points ? player.predicted_points : '??'}</td>
      <td>${player.news!== '' ? '!' : ' '} ${player.news}</td>
    </tr>`

  }
}



const recalcPlayers = () => {
  players.forEach(player => {
    // console.log(player)
    player.recent_points = 0
    player.adjusted_points = 0
  })
  for (let i = 0; i < lookback; i++) {
    // console.log(fetchedGameweeks[gameweek - i])
    fetchedGameweeks[gameweek - i].elements.forEach(player => {
      // console.log(player)
      //player pointer is player in main player array
      let player_pointer = players.find(x => x.id === player.id)
      // players[player.id - 1].recent_points += player.stats.total_points
      player_pointer.recent_points += player.stats.total_points
      // console.log(player)

      // here is ARRAY I for multiply gameweeks !!!!!!!!!!

      if (fixtures) {
        console.log(i, player)
        let fixture
        if (player.explain.length > 0) {
          fixture = fixtures.find(x => x.id === player.explain[0].fixture)

          console.log(fixture)

          let rival_team = player.team === fixture.team_h ? fixture.team_a : fixture.team_h
          let vs_strength = teams[rival_team-1].strength
          // let add
          // team_a , team_a_difficulty
          player_pointer.adjusted_points += (vs_strength * player.stats.total_points / 4)
        }

      }

    })
  }

  tabulatePlayers()
}








let list_amount = 20

dom.list_amount = document.querySelector('#amount-selector')

const changeAmount = (i) => {
  if (list_amount <= 5 && i < 0) {return}
  else {
    list_amount += i
    dom.list_amount.querySelector('span').textContent = list_amount
    if (i !== 0) {tabulatePlayers()}
  }


}
changeAmount(0)
dom.list_amount.querySelector('button:first-of-type').addEventListener('click', ()=>{
  changeAmount(-5)
})
dom.list_amount.querySelector('button:nth-of-type(2)').addEventListener('click', ()=>{
  changeAmount(5)
})



let lookback = 4

dom.lookback = document.querySelector('#lookback-selector')

const changeLookback = (i) => {
  if ((lookback === 1 && i < 0) || (lookback === gameweek && i > 0)) {return}
  else {
    lookback += i
    dom.lookback.querySelector('span').textContent = lookback
  }
  if (i === 0) { // stops fetching on first load
    return
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

for (let i = 0; i <= 4; i++) {
  let button = document.querySelectorAll('#position-selector button')[i]
  button.addEventListener('click', ()=>{

    position_filter = i
    tabulatePlayers()
    if (document.querySelector('#position-selector .selected')) {
      document.querySelector('#position-selector .selected').classList.remove('selected')
    }
    button.classList.add('selected')
  })
}
