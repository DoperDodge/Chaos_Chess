export default function GameOverOverlay({ result, myColor, onLeave }) {
  const won = result.winner && result.winner === myColor;
  const drawn = !result.winner;
  const headline = drawn ? 'DRAW' : won ? 'YOU WIN' : 'YOU LOSE';
  const color = drawn ? 'text-ice' : won ? 'text-gold' : 'text-ember';
  return (
    <div className="fixed inset-0 z-50 bg-night/90 backdrop-blur-md flex items-center justify-center slide-up">
      <div className="card text-center max-w-md w-full mx-4">
        <div className={`font-pixel text-3xl mb-3 ${color}`}>{headline}</div>
        <div className="font-retro text-xl text-pearl/70 mb-6">{describe(result.reason)}</div>
        <button className="btn btn-primary" onClick={onLeave}>Back to Lobby</button>
      </div>
    </div>
  );
}

function describe(reason) {
  switch (reason) {
    case 'checkmate': return 'Checkmate.';
    case 'stalemate': return 'Stalemate.';
    case 'draw': return 'Draw.';
    case 'resignation': return 'A player resigned.';
    case 'opponent-disconnect': return 'Opponent disconnected.';
    case 'bomb': return 'A bomb claimed the king.';
    default: return reason;
  }
}
