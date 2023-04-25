import React, {useEffect, useReducer} from "react"

const LEVELS = [
  // 0=plac, 1=ściana, 2=pudełka, 4=magazyn, 5=gracz, 8=przestrzeń
  [ // level 1
      [8,1,1,1,1,1,8],
      [8,1,0,5,0,1,8],
      [8,1,0,0,0,1,8],
      [8,1,0,2,0,1,8],
      [8,1,0,0,0,1,8],
      [8,1,0,0,0,1,8],
      [8,1,0,4,0,1,8],
      [8,1,1,1,1,1,8],
  ],  
  [ // level 2
      [8,1,1,1,1,1,1,1,1,1,8],
      [8,1,0,0,0,5,0,0,0,1,8],
      [8,1,0,2,0,0,0,2,0,1,8],
      [8,1,1,1,1,0,1,1,1,1,8],
      [8,1,0,0,0,0,0,0,0,1,8],
      [8,1,0,0,0,0,0,0,0,1,8],
      [8,1,0,0,0,0,1,1,1,1,8],
      [8,1,0,0,0,0,0,4,4,1,8],
      [8,1,1,1,1,1,1,1,1,1,8],
    ],
  [ // level 3    
    [8,1,1,1,1,1,1,1,1,1,8],
    [8,1,0,0,0,5,0,0,1,1,8],
    [8,1,0,0,0,0,2,0,0,1,8],
    [8,1,0,1,2,0,0,1,0,1,8],
    [8,1,0,1,0,1,0,0,0,1,8],
    [8,1,0,1,0,1,0,1,1,1,8],
    [8,1,0,0,0,0,0,0,0,1,8],
    [8,1,1,1,0,1,0,1,0,1,8],
    [8,1,4,0,0,0,0,0,0,1,8],
    [8,1,4,0,0,0,1,1,1,1,8],
    [8,1,1,1,1,1,1,1,1,1,8],
    ] 
  ]
//                0       1       2       3       4        5      6      7           8        //indexy jakie mają dane kolory
const COLOR = ["#ddd", "#777", "brown", null, "orange", "#000", null, "green", "transparent"] // definiowanie kolorów
const COLOR_IN_PLACE = 7 // index zielonego
const ITEM = { // przypisanie indexu koloru do itemów gry
  Playground:       0,
  Wall:             1,
  Box:              2,
  Storage:          4,
  Player:           5,
  World:            8 
}
const GAME_STATE = { // przypisywanie statusu gry czy zakończony czy w trakcie
  Running:          "RUNNING", 
  Done:             "DONE" 
} 
const ACTION = { // proces gry, trwanie gry 
  Move:             "MOVE", 
  RestartLevel:     "RESTART_LEVEL",
  PlayNextLevel:    "PLAY_NEXT_LEVEL"
}
const DIRECTION = { // kierunki, jakie nadają strzałki
  Left:             37, 
  Right:            39, 
  Up:               38, 
  Down:             40 
}

function getInitialState(levelNo) {// wczytywanie mapy levelu
  const LEVEL = LEVELS[levelNo] //pobieranie pierwszego levelu
  let level = [], player = {x: null, y: null}, box = []  // inicjowanie obiektów
  for (let y=0; y<LEVEL.length; y++) {
    level[y] = []
    for (let x=0; x<LEVEL[y].length; x++) {
      if ( [ITEM.Box, ITEM.Player].includes(LEVEL[y][x])) // pudła i gracz jako plac
        level[y][x] = ITEM.Playground 
      else // wczytanie dokładnych danych mapy
        level[y][x] = LEVEL[y][x] 
      if (LEVEL[y][x] === ITEM.Box)     box.push({x:x, y:y})    // wypełnienie pudłami
      if (LEVEL[y][x] === ITEM.Player)  player = {x:x, y:y}     // pozycja gracza
    }
  }
  return { // zwracanie wszystkiego powyżej
    levelNo:  levelNo,
    status:   GAME_STATE.Running,
    level, player, box
  }
}
function getColor(y,x, color, player, box, isStorage) { // nadawanie koloru odpowiednim itemom
  if (player.y === y && player.x === x)                   return ITEM.Player
  if (box.find( b => (b.y===y && b.x===x)) && isStorage ) return COLOR_IN_PLACE
  if (box.find( b => (b.y===y && b.x===x)))               return ITEM.Box  
  return color
}
function GameReducer(state, action) {
  switch (action.type) {
    case ACTION.RestartLevel:
      return {...getInitialState(state.levelNo), status: GAME_STATE.Running} // cofanie do początku poziomu czyli definiowanie przycisku restart
    case ACTION.PlayNextLevel:
      return {...getInitialState(state.levelNo+1), status: GAME_STATE.Running} // przejście do następnego poziomu czyli definiowanie przycisku następny level
    case ACTION.Move:
      let d = {x: 0, y: 0} 
      console.log(action.keyCode) // zmiana pozycji po kliknięciu strzałek
      if (DIRECTION.Left === action.keyCode)  d.x-- 
      if (DIRECTION.Right === action.keyCode) d.x++
      if (DIRECTION.Up === action.keyCode)    d.y--
      if (DIRECTION.Down === action.keyCode)  d.y++
      if ( state.level[state.player.y+d.y][state.player.x+d.x] === ITEM.Wall) return {...state} // sprawdzanie ścian
      if ( [...state.box].find(b => b.x===state.player.x+d.x && b.y===state.player.y+d.y) ) { // sprawdzanie czy gracz chce ruszyć pudło
        if ( // sprawdzanie czy jest możliwe przesunąć pudło
          [ITEM.Playground, ITEM.Storage].includes(state.level[state.player.y+2*d.y][state.player.x+2*d.x])  // sprawdzanie czy jest wolne miejsce za pudłem
          && ![...state.box].find(b => b.x === state.player.x+2*d.x && b.y === state.player.y+2*d.y)         // sprawdzanie czy nie ma pudła za pudłem
        ) { 
          let newState = {...state, player: {x: state.player.x+d.x, y: state.player.y+d.y}, box: [...state.box].map(b => { // zwracanie nowej pozycji pudła
            if ( (b.x === state.player.x+d.x) && (b.y === state.player.y+d.y) ) // jeżeli gracz próbuje zmienić pozycję pudła
              return {x: b.x+d.x, y: b.y+d.y} // zwracanie położenia
            else
              return b
          } ) }
          // sprawdzanie czy level ukończony czy cała gra skończona
          let boxesInPlace = 0
          newState.box.forEach(b=>{ if (newState.level[b.y][b.x] === ITEM.Storage) boxesInPlace++ })
          if (boxesInPlace === newState.box.length) return {...newState, status:GAME_STATE.Done}
          return newState
        } else // jeżeli gracz nie może poruszyć pudła to zostaje w tej samej pozycji
          return {...state}
      }
      return {...state, player: {x: state.player.x+d.x, y: state.player.y+d.y}} // standardowe poruszanie się po mapie gracza bez przeszkód
    default:  
  }
  return state
}



export default function Sokoban() { // regułki internetowe
  let [state, dispatch] = useReducer(GameReducer, getInitialState(0) )
  console.log(state)

  function handleMove(e) { // poruszanie się za pomocą strzałek i ich dokładny kierunek
    if ( [DIRECTION.Left, DIRECTION.Right, DIRECTION.Up, DIRECTION.Down].includes(e.keyCode) ) {
      e.preventDefault(); 
      dispatch({type: ACTION.Move, keyCode: e.keyCode}) 
    }
  }
  useEffect(() => { // dostałem radę aby tego użyć
    document.addEventListener('keydown', handleMove); 
    return () => { document.removeEventListener('keydown', handleMove); }
  });  

  return ( // finalne wypisywanie wysztkiego jako gotowa wersja już
    <div className="Sokoban">
      <h1 className="tytul">SOKOBAN by Christopher Niedźwiedzki</h1>
      <h3>Czarny = Gracz || Czerwony = Pudełka || Pomarańczowy = Magazyn</h3>
      <button onClick={() => dispatch({ type: ACTION.RestartLevel })}>Powtórz poziom</button>
      {state.status === GAME_STATE.Done && state.levelNo<LEVELS.length-1 && <button onClick={()=> dispatch({type: ACTION.PlayNextLevel})}>Następny poziom</button>}
      <div className="gra">
        {[...state.level].map( (row, y) => {
          return <div key={`${y}`} style={{display: 'block', lineHeight: 0}}>{
            row.map( (col, x) => {return <div key={`${y}-${x}`} style={{backgroundColor: COLOR[getColor(y,x, col, state.player, state.box, state.level[y][x]===ITEM.Storage)], width: "20px", height:"20px", display:"inline-block", border: state.level[y][x]===ITEM.World ? '1px solid transparent': '1px solid #ccc'}}/>})  
          }</div> 
        })}
        {state.status === GAME_STATE.Done && <h3>Udało się, gratulacje!</h3>}
        </div>
    </div>
  );
}