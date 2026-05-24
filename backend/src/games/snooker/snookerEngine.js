/**
 * Snooker Game Engine
 * 
 * Complete implementation with:
 * - 15 Red balls + 6 Colored balls
 * - Red → Color alternating pattern
 * - Colored balls re-spotted until all reds gone
 * - Final colors in order: Yellow → Green → Brown → Blue → Pink → Black
 * - All foul rules
 */

// Ball values
const BALLS = {
  CUE: { number: 0, color: '#FFFFFF', name: 'Cue Ball', value: 0 },
  RED: { number: 1, color: '#FF0000', name: 'Red', value: 1 },
  YELLOW: { number: 2, color: '#FFD700', name: 'Yellow', value: 2 },
  GREEN: { number: 3, color: '#00FF00', name: 'Green', value: 3 },
  BROWN: { number: 4, color: '#8B4513', name: 'Brown', value: 4 },
  BLUE: { number: 5, color: '#0000FF', name: 'Blue', value: 5 },
  PINK: { number: 6, color: '#FF69B4', name: 'Pink', value: 6 },
  BLACK: { number: 7, color: '#000000', name: 'Black', value: 7 },
};

const RED_BALLS = Array(15).fill(null).map((_, i) => ({ 
  id: i + 1, 
  number: 1, 
  type: 'red',
  spotted: true 
}));

const COLOR_BALLS = [
  { number: 2, type: 'yellow', value: 2, pos: { x: 25, y: 140 } },
  { number: 3, type: 'green', value: 3, pos: { x: 35, y: 130 } },
  { number: 4, type: 'brown', value: 4, pos: { x: 15, y: 130 } },
  { number: 5, type: 'blue', value: 5, pos: { x: 50, y: 100 } },
  { number: 6, type: 'pink', value: 6, pos: { x: 50, y: 50 } },
  { number: 7, type: 'black', value: 7, pos: { x: 50, y: 20 } },
];

const COLOR_ORDER = ['yellow', 'green', 'brown', 'blue', 'pink', 'black'];

class SnookerEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.phase = 'playing'; // playing, colors_phase, finished
    this.currentPlayer = 1;
    this.scores = { 1: 0, 2: 0 };
    this.redsRemaining = 15;
    this.redsPotted = [];
    this.colorsPotted = [];
    this.redsOnTable = Array(15).fill(true);
    this.colorsOnTable = { 
      yellow: true, green: true, brown: true, 
      blue: true, pink: true, black: true 
    };
    this.lastColorPotted = null;
    this.nextRequiredBall = 'red'; // 'red' or color name
    this.fouls = { 1: 0, 2: 0 };
    this.isBallInHand = false;
    this.ballInHandPlayer = null;
    this.isGameOver = false;
    this.winner = null;
    this.winReason = null;
    this.shotHistory = [];
    this.currentBreak = 0;
    this.highestBreak = 0;
    this.consecutiveRedPotRequired = false;
    
    // Color ball positions (standard snooker)
    this.colorPositions = {
      yellow: { x: 25, y: 140 },
      green: { x: 35, y: 130 },
      brown: { x: 15, y: 130 },
      blue: { x: 50, y: 100 },
      pink: { x: 50, y: 50 },
      black: { x: 50, y: 20 },
    };
    this.redPositions = this.getRedPositions();
  }

  getRedPositions() {
    // Pyramid formation behind the pink spot
    const positions = [];
    const startX = 50;
    const startY = 35;
    const spacing = 5;
    
    // 5 rows pyramid
    const rows = [1, 2, 3, 4, 5];
    let index = 0;
    for (let row = 0; row < rows.length; row++) {
      const ballsInRow = rows[row];
      const rowY = startY + row * spacing;
      for (let col = 0; col < ballsInRow; col++) {
        const rowX = startX - (ballsInRow - 1) * spacing / 2 + col * spacing;
        if (index < 15) {
          positions.push({ x: rowX, y: rowY });
          index++;
        }
      }
    }
    return positions;
  }

  /**
   * Process a shot
   */
  processShot(shot) {
    if (this.isGameOver) {
      return { success: false, error: 'Game is already over' };
    }

    const { pocketedBalls, foul, hitBall } = shot;
    const player = this.currentPlayer;

    const shotResult = {
      player,
      pocketedBalls: [],
      isFoul: false,
      foulReason: null,
      foulPoints: 0,
      pointsScored: 0,
      phase: this.phase,
      timestamp: new Date(),
      breakScore: this.currentBreak,
    };

    // Check for foul
    if (foul) {
      shotResult.isFoul = true;
      shotResult.foulReason = foul;
      this.handleFoul(player, foul, shotResult);
      return shotResult;
    }

    // Handle pocketed balls
    if (pocketedBalls && pocketedBalls.length > 0) {
      for (const ball of pocketedBalls) {
        if (ball.number === 0) {
          // Cue ball pocketed
          shotResult.isFoul = true;
          shotResult.foulReason = 'scratch';
          this.handleFoul(player, 'scratch', shotResult);
          return shotResult;
        }
        
        const result = this.handlePocketedBall(ball, player, shotResult);
        if (result && result.isFoul) {
          return shotResult;
        }
      }
    } else {
      // No ball pocketed
      if (this.nextRequiredBall) {
        // Check if hit the right ball
        if (hitBall && !this.isRequiredBall(hitBall)) {
          shotResult.isFoul = true;
          shotResult.foulReason = 'wrong_ball';
          this.handleFoul(player, 'wrong_ball', shotResult);
          return shotResult;
        }
      }
      
      // Break ends
      this.currentBreak = 0;
      this.switchPlayer();
    }

    this.shotHistory.push(shotResult);
    return shotResult;
  }

  /**
   * Handle pocketed ball
   */
  handlePocketedBall(ball, player, shotResult) {
    const ballName = this.getBallName(ball);
    
    if (ballName === 'red') {
      // Red ball potted
      if (this.nextRequiredBall !== 'red') {
        // Potted red when should have potted color
        shotResult.isFoul = true;
        shotResult.foulReason = 'potted_wrong_ball';
        this.handleFoul(player, 'potted_wrong_ball', shotResult);
        return shotResult;
      }
      
      this.redsRemaining--;
      this.scores[player] += 1;
      shotResult.pointsScored += 1;
      this.currentBreak += 1;
      this.nextRequiredBall = 'color'; // Must pot a color next
      this.consecutiveRedPotRequired = false;
      
    } else if (ballName !== 'red' && ballName !== 'cue') {
      // Color ball potted
      const colorValue = this.getBallValue(ballName);
      
      if (this.phase === 'colors_phase') {
        // Final colors phase - must pot in order
        const nextColor = COLOR_ORDER[this.colorsPotted.filter(c => COLOR_ORDER.includes(c)).length];
        if (ballName !== nextColor) {
          shotResult.isFoul = true;
          shotResult.foulReason = 'wrong_color_order';
          this.handleFoul(player, 'wrong_color_order', shotResult);
          return shotResult;
        }
        
        this.scores[player] += colorValue;
        shotResult.pointsScored += colorValue;
        this.currentBreak += colorValue;
        this.colorsPotted.push(ballName);
        this.colorsOnTable[ballName] = false;
        
        // Check if game is over
        if (this.colorsPotted.filter(c => COLOR_ORDER.includes(c)).length >= 6) {
          this.handleWin(player, 'all_balls_potted');
          shotResult.gameOver = true;
          return shotResult;
        }
        
      } else {
        // Normal phase
        if (this.nextRequiredBall !== ballName && this.nextRequiredBall !== 'color') {
          shotResult.isFoul = true;
          shotResult.foulReason = 'potted_wrong_ball';
          this.handleFoul(player, 'potted_wrong_ball', shotResult);
          return shotResult;
        }
        
        this.scores[player] += colorValue;
        shotResult.pointsScored += colorValue;
        this.currentBreak += colorValue;
        this.lastColorPotted = ballName;
        
        // Re-spot the color ball if reds remain
        if (this.redsRemaining > 0) {
          this.colorsOnTable[ballName] = true; // Ball stays on table
          // In real snooker, color is re-spotted to its original position
          shotResult.reSpotted = true;
        } else {
          this.colorsOnTable[ballName] = false;
          this.colorsPotted.push(ballName);
        }
        
        // Check if should transition to colors phase
        if (this.redsRemaining === 0 && this.colorsOnTable[ballName]) {
          // Color re-spotted, continue with reds (but there are none)
          // This shouldn't happen normally - transition when reds hit 0
        }
        
        if (this.redsRemaining === 0) {
          this.phase = 'colors_phase';
          this.nextRequiredBall = COLOR_ORDER[0]; // Yellow first
        } else {
          this.nextRequiredBall = 'red'; // Must pot a red next
        }
      }
    }
    
    // Check break
    if (this.currentBreak > this.highestBreak) {
      this.highestBreak = this.currentBreak;
    }
  }

  /**
   * Handle foul
   */
  handleFoul(player, reason, shotResult) {
    const foulValue = this.getFoulValue(reason);
    const otherPlayer = player === 1 ? 2 : 1;
    
    // Minimum 4 points for foul
    const points = Math.max(4, foulValue);
    this.scores[otherPlayer] += points;
    shotResult.foulPoints = points;
    shotResult.pointsScored = 0;
    
    this.currentBreak = 0;
    this.fouls[player]++;
    
    this.isBallInHand = true;
    this.ballInHandPlayer = otherPlayer;
    
    // Switch player
    this.switchPlayer();
    
    // If player conceded (too many points behind)
    // This is checked in the game service
  }

  /**
   * Check if ball is the required ball
   */
  isRequiredBall(ball) {
    const ballName = this.getBallName(ball);
    if (this.nextRequiredBall === 'red') {
      return ballName === 'red';
    }
    if (this.nextRequiredBall === 'color') {
      return ballName !== 'red' && ballName !== 'cue';
    }
    return ballName === this.nextRequiredBall;
  }

  /**
   * Get ball name
   */
  getBallName(ball) {
    if (!ball || !ball.number) return 'cue';
    const ballNames = { 1: 'red', 2: 'yellow', 3: 'green', 4: 'brown', 5: 'blue', 6: 'pink', 7: 'black' };
    return ballNames[ball.number] || 'unknown';
  }

  /**
   * Get ball value
   */
  getBallValue(name) {
    const values = { red: 1, yellow: 2, green: 3, brown: 4, blue: 5, pink: 6, black: 7 };
    return values[name] || 0;
  }

  /**
   * Get foul value (based on ball involved)
   */
  getFoulValue(reason) {
    const foulValues = {
      scratch: 4,
      wrong_ball: 4,
      potted_wrong_ball: 4,
      wrong_color_order: 4,
      no_ball_hit: 4,
      jump_shot: 4,
      touched_ball: 4,
      push_shot: 4,
    };
    return foulValues[reason] || 4;
  }

  /**
   * Handle win
   */
  handleWin(player, reason) {
    this.isGameOver = true;
    this.winner = player;
    this.winReason = reason;
    this.phase = 'finished';
  }

  /**
   * Switch current player
   */
  switchPlayer() {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
  }

  /**
   * Get game state
   */
  getGameState() {
    const maxPossibleScore = this.scores[1] > this.scores[2] 
      ? this.scores[1] + this.getRemainingPoints()
      : this.scores[2] + this.getRemainingPoints();
    
    return {
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      scores: this.scores,
      redsRemaining: this.redsRemaining,
      colorsOnTable: this.colorsOnTable,
      nextRequiredBall: this.nextRequiredBall,
      isBallInHand: this.isBallInHand,
      ballInHandPlayer: this.ballInHandPlayer,
      winner: this.winner,
      winReason: this.winReason,
      isGameOver: this.isGameOver,
      currentBreak: this.currentBreak,
      highestBreak: this.highestBreak,
      maxPossibleScore,
      shotCount: this.shotHistory.length,
      fouls: this.fouls,
    };
  }

  /**
   * Get remaining points on table
   */
  getRemainingPoints() {
    let points = this.redsRemaining * 8; // 1 for red + 7 for black (max)
    if (this.colorsOnTable.yellow) points += 2;
    if (this.colorsOnTable.green) points += 3;
    if (this.colorsOnTable.brown) points += 4;
    if (this.colorsOnTable.blue) points += 5;
    if (this.colorsOnTable.pink) points += 6;
    if (this.colorsOnTable.black) points += 7;
    return points;
  }

  /**
   * Get snooker rules step-by-step
   */
  static getRules() {
    return {
      title: "Snooker Rules (Step-by-Step)",
      setup: [
        "15 Red balls pyramid mein rakhein (1 point each)",
        "6 Colored balls apne designated spots par rakhein",
        "Yellow (2), Green (3), Brown (4), Blue (5), Pink (6), Black (7)",
        "White cue ball baazi area mein rakhein",
        "Player 1 break shot leta hai",
      ],
      objective: "Sabse zyada points score karo — legal shots se balls pot karke",
      turnFlow: [
        {
          step: 1,
          name: "Normal Phase — Red Ball Pot Karna",
          description: "Pehle ek RED ball pot karo (1 point). Har shot mein pehle red ball ko hit karna zaroori hai.",
          image: "red-ball-focus",
        },
        {
          step: 2,
          name: "Red Ke Baad — Color Ball Pot Karna",
          description: "Red pot karne ke baad, koi bhi COLOR ball pot kar sakte ho (2-7 points). Color pot hone ke baad wapas apni jagah re-spot hoti hai.",
          details: "Koi bhi color — Yellow (2), Green (3), Brown (4), Blue (5), Pink (6), ya Black (7) — pot kar sakte ho.",
        },
        {
          step: 3,
          name: "Pattern Repeat: RED → COLOR → RED → COLOR",
          description: "Yeh pattern repeat hota hai: Red pot karo → Color pot karo → Red pot karo → Color pot karo... Jab tak saare 15 reds pot na ho jayein.",
          tip: "Black (7 points) sabse valuable hai! Maximum players black hi pot karte hain red ke baad.",
        },
        {
          step: 4,
          name: "FINAL PHASE — Colored Balls In Order",
          description: "Jab saare 15 reds pot ho jayein, ab colors ko FIXED ORDER mein pot karna hai:",
          colorOrder: [
            { ball: "Yellow", value: 2, desc: "Pehle Yellow pot karo" },
            { ball: "Green", value: 3, desc: "Phir Green pot karo" },
            { ball: "Brown", value: 4, desc: "Phir Brown pot karo" },
            { ball: "Blue", value: 5, desc: "Phir Blue pot karo" },
            { ball: "Pink", value: 6, desc: "Phir Pink pot karo" },
            { ball: "Black", value: 7, desc: "Sabse aakhri mein Black pot karo" },
          ],
          note: "Is phase mein colors RE-SPOT nahi hoti — ek baar pot hui toh hui.",
        },
        {
          step: 5,
          name: "Game Over",
          description: "Jab final black pot ho jaye (ya player concede kare) → game khatam. JO ZYADA SCORE KAREGA WOH JEEGEGA! 🏆",
        },
      ],
      fouls: [
        { rule: "Cue ball pocket (scratch)", penalty: "Opponent ko 4+ points" },
        { rule: "Red hit karna chahiye tha, color hit kiya", penalty: "Opponent ko 4+ points" },
        { rule: "Required ball nahi hit ki", penalty: "Opponent ko minimum 4 points" },
        { rule: "Ball pot kiya jab pot nahi karna chahiye tha", penalty: "Opponent ko points" },
        { rule: "Jump shot", penalty: "Foul — opponent ko points" },
        { rule: "Ball ko cue ke alawa kisi aur se touch kiya", penalty: "Foul — opponent ko points" },
      ],
      scoring: {
        red: 1,
        yellow: 2,
        green: 3,
        brown: 4,
        blue: 5,
        pink: 6,
        black: 7,
        maxBreak: 147, // 15 reds + 15 blacks + all colors
      },
      ballColors: BALLS,
    };
  }
}

module.exports = { SnookerEngine, BALLS };
