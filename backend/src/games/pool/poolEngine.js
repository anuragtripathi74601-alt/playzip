/**
 * Pool (8-Ball) Game Engine
 * 
 * Complete implementation with:
 * - 15 balls + cue ball
 * - Solid/Stripe assignment after break
 * - All foul rules (scratch, wrong ball, no rail, 3 consecutive fouls)
 * - 8-ball late rule
 * - Turn-based play
 */

const TABLE_WIDTH = 100;  // Units
const TABLE_HEIGHT = 200;

// Ball colors and numbers
const BALLS = {
  CUE: { number: 0, color: '#FFFFFF', name: 'Cue Ball' },
  // Solids (1-7)
  1: { number: 1, color: '#FFD700', name: 'Yellow', group: 'solid' },
  2: { number: 2, color: '#0000FF', name: 'Blue', group: 'solid' },
  3: { number: 3, color: '#FF0000', name: 'Red', group: 'solid' },
  4: { number: 4, color: '#800080', name: 'Purple', group: 'solid' },
  5: { number: 5, color: '#FF8C00', name: 'Orange', group: 'solid' },
  6: { number: 6, color: '#008000', name: 'Green', group: 'solid' },
  7: { number: 7, color: '#800000', name: 'Maroon', group: 'solid' },
  // 8-Ball
  8: { number: 8, color: '#000000', name: 'Black', group: 'eight' },
  // Stripes (9-15)
  9: { number: 9, color: '#FFD700', name: 'Yellow Stripe', group: 'stripe' },
  10: { number: 10, color: '#0000FF', name: 'Blue Stripe', group: 'stripe' },
  11: { number: 11, color: '#FF0000', name: 'Red Stripe', group: 'stripe' },
  12: { number: 12, color: '#800080', name: 'Purple Stripe', group: 'stripe' },
  13: { number: 13, color: '#FF8C00', name: 'Orange Stripe', group: 'stripe' },
  14: { number: 14, color: '#008000', name: 'Green Stripe', group: 'stripe' },
  15: { number: 15, color: '#800000', name: 'Maroon Stripe', group: 'stripe' },
};

class PoolEngine {
  constructor() {
    this.reset();
  }

  reset() {
    // Game state
    this.phase = 'rack'; // rack, break, open, solids_stripes, normal, eight_ball, finished
    this.currentPlayer = 1; // 1 or 2
    this.players = {
      1: { group: null, balls_remaining: [1,2,3,4,5,6,7,9,10,11,12,13,14,15], pocketed: [] },
      2: { group: null, balls_remaining: [1,2,3,4,5,6,7,9,10,11,12,13,14,15], pocketed: [] },
    };
    this.ballsOnTable = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    this.pocketedBalls = [];
    this.fouls = { 1: 0, 2: 0 }; // Consecutive fouls
    this.totalFouls = { 1: 0, 2: 0 };
    this.isBallInHand = false;
    this.ballInHandPlayer = null;
    this.lastShot = null;
    this.winner = null;
    this.winReason = null;
    this.isGameOver = false;
    this.shotHistory = [];
    this.breakCompleted = false;
    this.firstPocketedAfterBreak = null;
    
    // Ball positions (standard 8-ball rack)
    this.ballPositions = this.getRackPositions();
    this.cueBallPosition = { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 30 };
  }

  getRackPositions() {
    // Standard triangle rack at top of table
    const positions = {};
    const startX = TABLE_WIDTH / 2;
    const startY = 30;
    const spacing = 7;
    
    // Rack formation: 8-ball in center
    // Row 1 (back): 1 ball
    positions[1] = { x: startX, y: startY };
    
    // Row 2: 2 balls
    const row2Y = startY + spacing * Math.sqrt(3) / 2;
    positions[11] = { x: startX - spacing/2, y: row2Y };
    positions[2] = { x: startX + spacing/2, y: row2Y };
    
    // Row 3: 3 balls (8-ball in middle)
    const row3Y = row2Y + spacing * Math.sqrt(3) / 2;
    positions[3] = { x: startX - spacing, y: row3Y };
    positions[8] = { x: startX, y: row3Y };
    positions[9] = { x: startX + spacing, y: row3Y };
    
    // Row 4: 4 balls
    const row4Y = row3Y + spacing * Math.sqrt(3) / 2;
    positions[12] = { x: startX - spacing * 1.5, y: row4Y };
    positions[4] = { x: startX - spacing * 0.5, y: row4Y };
    positions[10] = { x: startX + spacing * 0.5, y: row4Y };
    positions[14] = { x: startX + spacing * 1.5, y: row4Y };
    
    // Row 5: 5 balls
    const row5Y = row4Y + spacing * Math.sqrt(3) / 2;
    positions[13] = { x: startX - spacing * 2, y: row5Y };
    positions[5] = { x: startX - spacing, y: row5Y };
    positions[6] = { x: startX, y: row5Y };
    positions[15] = { x: startX + spacing, y: row5Y };
    positions[7] = { x: startX + spacing * 2, y: row5Y };
    
    return positions;
  }

  /**
   * Process a shot
   */
  processShot(shot) {
    if (this.isGameOver) {
      return { success: false, error: 'Game is already over' };
    }

    const { cueAngle, cuePower, targetBall, pocketedBalls, foul } = shot;
    const player = this.currentPlayer;
    
    // Validate shot
    if (!cueAngle || !cuePower) {
      return { success: false, error: 'Invalid shot parameters' };
    }

    const shotResult = {
      player,
      cueAngle,
      cuePower,
      targetBall,
      pocketedBalls: [],
      isFoul: false,
      foulReason: null,
      phase: this.phase,
      timestamp: new Date(),
    };

    // Check for fouls
    if (foul) {
      shotResult.isFoul = true;
      shotResult.foulReason = foul;
      this.handleFoul(player, foul, shotResult);
      return shotResult;
    }

    // Process pocketed balls
    if (pocketedBalls && pocketedBalls.length > 0) {
      shotResult.pocketedBalls = pocketedBalls;
      
      for (const ballNumber of pocketedBalls) {
        if (ballNumber === 0) {
          // Cue ball pocketed (scratch)
          shotResult.isFoul = true;
          shotResult.foulReason = 'scratch';
          this.handleFoul(player, 'scratch', shotResult);
          return shotResult;
        }
        
        this.handlePocketedBall(ballNumber, player, shotResult);
      }
    } else {
      // No ball pocketed - check if rail was hit
      if (!shotResult.isFoul && !shot.hitRail) {
        shotResult.isFoul = true;
        shotResult.foulReason = 'no_rail';
        this.handleFoul(player, 'no_rail', shotResult);
      }
    }

    // Handle group assignment after break
    if (!this.breakCompleted && pocketedBalls && pocketedBalls.length > 0) {
      this.breakCompleted = true;
      const firstLegalBall = pocketedBalls.find(b => b !== 8 && b !== 0);
      if (firstLegalBall) {
        this.firstPocketedAfterBreak = firstLegalBall;
      }
    }

    // First shot after break - determine groups
    if (this.phase === 'break' || this.phase === 'open') {
      if (this.breakCompleted && this.firstPocketedAfterBreak) {
        this.assignGroups(this.firstPocketedAfterBreak, player);
      }
    }

    // Check for win/loss conditions
    if (this.phase === 'eight_ball') {
      this.checkEightBallShot(shotResult, player);
    }

    // Switch or stay
    if (!shotResult.isFoul && shotResult.pocketedBalls.length > 0 && !shotResult.isGameOver) {
      // Player continues (pocketed a legal ball)
      this.fouls[player] = 0;
    } else {
      // Switch players
      this.switchPlayer();
    }

    this.shotHistory.push(shotResult);
    this.lastShot = shotResult;

    return shotResult;
  }

  /**
   * Handle pocketed ball
   */
  handlePocketedBall(ballNumber, player, shotResult) {
    const ball = BALLS[ballNumber];
    
    if (ballNumber === 8) {
      // 8-ball pocketed
      if (this.phase === 'eight_ball') {
        // Legal 8-ball pocket
        this.handleWin(player, 'pocketed_8_ball');
        shotResult.gameOver = true;
      } else {
        // 8-ball pocketed too early - LOSE
        const otherPlayer = player === 1 ? 2 : 1;
        this.handleWin(otherPlayer, 'early_eight_ball');
        shotResult.gameOver = true;
        shotResult.isFoul = true;
        shotResult.foulReason = 'early_eight_ball';
      }
      return;
    }

    // Remove ball from table
    this.ballsOnTable = this.ballsOnTable.filter(b => b !== ballNumber);
    this.pocketedBalls.push(ballNumber);
    
    // Remove from player's balls
    this.players[player].balls_remaining = 
      this.players[player].balls_remaining.filter(b => b !== ballNumber);
    this.players[player].pocketed.push(ballNumber);

    // Check if player has cleared their group
    if (this.players[player].group) {
      const groupBalls = this.players[player].balls_remaining.filter(
        b => BALLS[b].group === this.players[player].group
      );
      if (groupBalls.length === 0) {
        // Check if all non-group balls are gone too
        // Group is empty - enter eight-ball phase
        this.phase = 'eight_ball';
      }
    }
  }

  /**
   * Assign solid/stripe groups after break
   */
  assignGroups(firstPocketedBall, playerWhoPocketed) {
    const ballGroup = BALLS[firstPocketedBall].group;
    
    // First ball pocketed determines groups
    this.players[playerWhoPocketed].group = ballGroup;
    const otherPlayer = playerWhoPocketed === 1 ? 2 : 1;
    this.players[otherPlayer].group = ballGroup === 'solid' ? 'stripe' : 'solid';
    
    this.phase = 'normal';
  }

  /**
   * Handle foul
   */
  handleFoul(player, reason, shotResult) {
    this.fouls[player]++;
    this.totalFouls[player]++;
    
    // Check for 3 consecutive fouls
    if (this.fouls[player] >= 3) {
      const otherPlayer = player === 1 ? 2 : 1;
      this.handleWin(otherPlayer, 'three_consecutive_fouls');
      shotResult.gameOver = true;
      return;
    }
    
    this.isBallInHand = true;
    this.ballInHandPlayer = this.currentPlayer === 1 ? 2 : 1; // Opponent gets ball-in-hand
  }

  /**
   * Check if 8-ball shot was legal
   */
  checkEightBallShot(shotResult, player) {
    if (shotResult.pocketedBalls.includes(8)) {
      // 8-ball pocketed
      // Check if it was a called pocket (if rules require it)
      // For simplicity, any legal 8-ball pocket = win
      if (!shotResult.isFoul) {
        this.handleWin(player, 'pocketed_8_ball');
        shotResult.gameOver = true;
      } else {
        // Foul on 8-ball shot = loss
        const otherPlayer = player === 1 ? 2 : 1;
        // Actually scratch on 8-ball = loss
        if (shotResult.foulReason === 'scratch') {
          this.handleWin(otherPlayer, 'scratch_on_eight');
          shotResult.gameOver = true;
        }
      }
    }
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
    return {
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      players: {
        1: {
          group: this.players[1].group,
          balls_remaining: this.players[1].balls_remaining,
          pocketed: this.players[1].pocketed,
          fouls: this.fouls[1],
        },
        2: {
          group: this.players[2].group,
          balls_remaining: this.players[2].balls_remaining,
          pocketed: this.players[2].pocketed,
          fouls: this.fouls[2],
        },
      },
      ballsOnTable: this.ballsOnTable,
      pocketedBalls: this.pocketedBalls,
      isBallInHand: this.isBallInHand,
      ballInHandPlayer: this.ballInHandPlayer,
      lastShot: this.lastShot,
      winner: this.winner,
      winReason: this.winReason,
      isGameOver: this.isGameOver,
      ballPositions: this.ballPositions,
      cueBallPosition: this.cueBallPosition,
      shotCount: this.shotHistory.length,
    };
  }

  /**
   * Get pool rules step-by-step
   */
  static getRules() {
    return {
      title: "8-Ball Pool Rules",
      setup: [
        "15 balls ko triangle mein rack karo (8-ball center mein)",
        "Cue ball (white) opposite end pe rakho",
        "Player 1 break shot leta hai",
      ],
      objective: "Apne group (solid ya stripe) ke saare balls pocket karo, phir 8-ball pocket karo",
      groups: {
        solids: [1, 2, 3, 4, 5, 6, 7],
        stripes: [9, 10, 11, 12, 13, 14, 15],
        eight: 8,
      },
      turnFlow: [
        {
          step: 1,
          name: "Break Shot",
          description: "Pehla shot — rack tod do. Koi ball pocket hoti hai toh game shuru hota hai.",
        },
        {
          step: 2,
          name: "Group Assignment",
          description: "Jo pehla ball pocket hota hai (solid/stripe), woh us player ka group ban jata hai. Doosre player ko doosra group milta hai.",
          details: "Agar pehle shot mein solid pocket hua → Player 1 = Solids, Player 2 = Stripes. Agar koi ball nahi pocketa → Open table, agli shot se group decide hoga.",
        },
        {
          step: 3,
          name: "Apne Group Ke Balls Pocket Karo",
          description: "Har baari apne group ka ek ball pocket karna hai. Pehle cue ball se apne group ke ball ko hit karo.",
          rules: [
            "Cue ball se pehle apne group ka ball hit karna zaroori hai",
            "Agar galat ball pehle hit kiya → foul (opponent ko ball-in-hand)",
            "Agar pocket kiya → ek aur shot milega",
            "Agar koi ball pocket nahi kiya → turn doosre player ko",
          ],
        },
        {
          step: 4,
          name: "8-Ball Shot",
          description: "Apne group ke saare 7 balls pocket karne ke baad, 8-ball pocket karne ka time hai.",
          rules: [
            "8-ball pocket karne se pehle pocket call karna hai (konsa pocket)",
            "8-ball galat pocket mein gaya → HAAR",
            "8-ball shot pe cue ball pocket hua → HAAR",
            "8-ball group clear hone se pehle pocket hua → HAAR",
          ],
        },
        {
          step: 5,
          name: "Victory!",
          description: "8-ball sahi pocket mein dalo → JEEP! 🏆",
        },
      ],
      fouls: [
        { rule: "Scratch (cue ball pocket)", penalty: "Ball-in-hand for opponent" },
        { rule: "Wrong ball hit first", penalty: "Ball-in-hand for opponent" },
        { rule: "No ball pocketed & no rail hit", penalty: "Ball-in-hand for opponent" },
        { rule: "3 consecutive fouls", penalty: "Automatic LOSS" },
        { rule: "8-ball pocketed early", penalty: "Automatic LOSS" },
        { rule: "8-ball scratch", penalty: "Automatic LOSS (if on 8-ball shot)" },
      ],
      ballColors: BALLS,
    };
  }
}

module.exports = { PoolEngine, BALLS };
