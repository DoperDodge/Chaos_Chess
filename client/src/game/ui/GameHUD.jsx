export default function GameHUD({ state, myColor, onResign, onLeave }) {
  const yourTurn = state.currentColor === myColor;
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-midnight/70 border-b border-violet">
      <div className="flex items-center gap-2">
        <button className="btn text-[10px]" onClick={onLeave}>← Leave</button>
        <button className="btn text-[10px]" onClick={onResign}>Resign</button>
      </div>
      <div className="text-center">
        <div className="font-pixel text-[10px] text-ice">TURN {state.turnNumber}</div>
        <div className={`font-pixel text-sm ${yourTurn ? 'text-gold pulse-glow inline-block px-2 py-1 rounded' : 'text-pearl/60'}`}>
          {yourTurn ? 'YOUR MOVE' : 'OPPONENT THINKING'}
        </div>
      </div>
      <div className="text-right">
        <div className="font-pixel text-[10px] text-ice">YOU ARE</div>
        <div className="font-pixel text-sm text-pearl">{(myColor || '?').toUpperCase()}</div>
      </div>
    </div>
  );
}
