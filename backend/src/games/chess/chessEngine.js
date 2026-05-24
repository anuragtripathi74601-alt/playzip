/**
 * Chess Game Engine
 * 
 * Complete chess implementation with:
 * - All 6 piece types with proper movement
 * - Pawn promotion, En Passant, Castling
 * - Check, Checkmate, Stalemate detection
 * - Time controls (5, 10, 15, unlimited minutes)
 * - Full move validation
 */

// Piece types
const PIECES = {
  KING: 'king',
  QUEEN: 'queen',
  ROOK: 'rook',
  BISHOP: 'bishop',
  KNIGHT: 'knight',
  PAWN: 'pawn',
};

// Colors
const COLORS = {
  WHITE: 'white',
  BLACK: 'black',
};

// Unicode pieces for display
const UNICODE_PIECES = {
  white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
  black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
};

class ChessEngine {
  constructor(timeOption = 0) {
    this.board = this.initializeBoard();
    this.currentTurn = COLORS.WHITE;
    this.moveHistory = [];
    this.capturedPieces = { white: [], black: [] };
    this.gameStatus = 'playing'; // playing, check, checkmate, stalemate, draw
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.enPassantTarget = null;
    this.castlingRights = {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    };
    this.lastMove = null;
    this.checkSquare = null;
    
    // Time controls (in seconds, 0 = unlimited)
    this.timeControl = timeOption;
    this.timers = {
      white: timeOption > 0 ? timeOption * 60 : Infinity,
      black: timeOption > 0 ? timeOption * 60 : Infinity,
    };
    this.lastMoveTime = Date.now();
    this.isTimerRunning = false;
  }

  /**
   * Initialize standard chess board
   */
  initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Set up back rank
    const backRank = [PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN, 
                      PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK];
    
    for (let col = 0; col < 8; col++) {
      board[0][col] = { type: backRank[col], color: COLORS.BLACK };
      board[1][col] = { type: PIECES.PAWN, color: COLORS.BLACK };
      board[6][col] = { type: PIECES.PAWN, color: COLORS.WHITE };
      board[7][col] = { type: backRank[col], color: COLORS.WHITE };
    }
    
    return board;
  }

  /**
   * Get piece at position
   */
  getPiece(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return this.board[row][col];
  }

  /**
   * Check if position is on board
   */
  isInBounds(row, col) {
    return row >= 0 && row <= 7 && col >= 0 && col <= 7;
  }

  /**
   * Get legal moves for a piece at given position
   */
  getLegalMoves(row, col) {
    const piece = this.getPiece(row, col);
    if (!piece || piece.color !== this.currentTurn) return [];
    
    const pseudoLegalMoves = this.getPseudoLegalMoves(row, col);
    
    // Filter out moves that leave king in check
    return pseudoLegalMoves.filter(move => {
      return !this.wouldBeInCheck(row, col, move.toRow, move.toCol, piece.color);
    });
  }

  /**
   * Get pseudo-legal moves (basic validation without check detection)
   */
  getPseudoLegalMoves(row, col) {
    const piece = this.getPiece(row, col);
    if (!piece) return [];
    
    const moves = [];
    
    switch (piece.type) {
      case PIECES.PAWN:
        this.getPawnMoves(row, col, piece.color, moves);
        break;
      case PIECES.KNIGHT:
        this.getKnightMoves(row, col, piece.color, moves);
        break;
      case PIECES.BISHOP:
        this.getSlidingMoves(row, col, piece.color, [[1,1], [1,-1], [-1,1], [-1,-1]], moves);
        break;
      case PIECES.ROOK:
        this.getSlidingMoves(row, col, piece.color, [[1,0], [-1,0], [0,1], [0,-1]], moves);
        break;
      case PIECES.QUEEN:
        this.getSlidingMoves(row, col, piece.color, 
          [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]], moves);
        break;
      case PIECES.KING:
        this.getKingMoves(row, col, piece.color, moves);
        break;
    }
    
    return moves;
  }

  /**
   * Pawn moves
   */
  getPawnMoves(row, col, color, moves) {
    const direction = color === COLORS.WHITE ? -1 : 1;
    const startRow = color === COLORS.WHITE ? 6 : 1;
    const promotionRow = color === COLORS.WHITE ? 0 : 7;
    
    // Move forward one square
    const oneForward = row + direction;
    if (this.isInBounds(oneForward, col) && !this.getPiece(oneForward, col)) {
      if (oneForward === promotionRow) {
        // Pawn promotion
        for (const promoType of [PIECES.QUEEN, PIECES.ROOK, PIECES.BISHOP, PIECES.KNIGHT]) {
          moves.push({ fromRow: row, fromCol: col, toRow: oneForward, toCol: col, promotion: promoType });
        }
      } else {
        moves.push({ fromRow: row, fromCol: col, toRow: oneForward, toCol: col });
      }
      
      // Move forward two squares (only from starting position)
      const twoForward = row + 2 * direction;
      if (row === startRow && !this.getPiece(twoForward, col)) {
        moves.push({ fromRow: row, fromCol: col, toRow: twoForward, toCol: col, isDoublePawnPush: true });
      }
    }
    
    // Captures
    for (const dc of [-1, 1]) {
      const captureCol = col + dc;
      if (!this.isInBounds(oneForward, captureCol)) continue;
      
      const target = this.getPiece(oneForward, captureCol);
      if (target && target.color !== color) {
        if (oneForward === promotionRow) {
          for (const promoType of [PIECES.QUEEN, PIECES.ROOK, PIECES.BISHOP, PIECES.KNIGHT]) {
            moves.push({ fromRow: row, fromCol: col, toRow: oneForward, toCol: captureCol, promotion: promoType });
          }
        } else {
          moves.push({ fromRow: row, fromCol: col, toRow: oneForward, toCol: captureCol });
        }
      }
      
      // En Passant
      if (this.enPassantTarget && 
          this.enPassantTarget.row === oneForward && 
          this.enPassantTarget.col === captureCol) {
        moves.push({ 
          fromRow: row, fromCol: col, 
          toRow: oneForward, toCol: captureCol, 
          isEnPassant: true 
        });
      }
    }
  }

  /**
   * Knight moves (L-shape)
   */
  getKnightMoves(row, col, color, moves) {
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    
    for (const [dr, dc] of knightMoves) {
      const nr = row + dr;
      const nc = col + dc;
      if (!this.isInBounds(nr, nc)) continue;
      
      const target = this.getPiece(nr, nc);
      if (!target || target.color !== color) {
        moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc });
      }
    }
  }

  /**
   * Sliding piece moves (Bishop, Rook, Queen)
   */
  getSlidingMoves(row, col, color, directions, moves) {
    for (const [dr, dc] of directions) {
      let nr = row + dr;
      let nc = col + dc;
      
      while (this.isInBounds(nr, nc)) {
        const target = this.getPiece(nr, nc);
        if (!target) {
          moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc });
        } else {
          if (target.color !== color) {
            moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc });
          }
          break; // Blocked by piece
        }
        nr += dr;
        nc += dc;
      }
    }
  }

  /**
   * King moves (including castling)
   */
  getKingMoves(row, col, color, moves) {
    const kingMoves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];
    
    for (const [dr, dc] of kingMoves) {
      const nr = row + dr;
      const nc = col + dc;
      if (!this.isInBounds(nr, nc)) continue;
      
      const target = this.getPiece(nr, nc);
      if (!target || target.color !== color) {
        moves.push({ fromRow: row, fromCol: col, toRow: nr, toCol: nc });
      }
    }
    
    // Castling
    const castlingSide = color === COLORS.WHITE ? 'white' : 'black';
    const kingRow = color === COLORS.WHITE ? 7 : 0;
    
    // King-side castling (O-O)
    if (this.castlingRights[castlingSide].kingSide) {
      const rook = this.getPiece(kingRow, 7);
      if (rook && rook.type === PIECES.ROOK && rook.color === color &&
          !this.getPiece(kingRow, 5) && !this.getPiece(kingRow, 6)) {
        // Check that king doesn't pass through check
        if (!this.isSquareAttacked(kingRow, 4, color) &&
            !this.isSquareAttacked(kingRow, 5, color) &&
            !this.isSquareAttacked(kingRow, 6, color)) {
          moves.push({ fromRow: kingRow, fromCol: 4, toRow: kingRow, toCol: 6, isCastling: 'kingSide' });
        }
      }
    }
    
    // Queen-side castling (O-O-O)
    if (this.castlingRights[castlingSide].queenSide) {
      const rook = this.getPiece(kingRow, 0);
      if (rook && rook.type === PIECES.ROOK && rook.color === color &&
          !this.getPiece(kingRow, 1) && !this.getPiece(kingRow, 2) && !this.getPiece(kingRow, 3)) {
        if (!this.isSquareAttacked(kingRow, 4, color) &&
            !this.isSquareAttacked(kingRow, 3, color) &&
            !this.isSquareAttacked(kingRow, 2, color)) {
          moves.push({ fromRow: kingRow, fromCol: 4, toRow: kingRow, toCol: 2, isCastling: 'queenSide' });
        }
      }
    }
  }

  /**
   * Check if a square is attacked by opponent
   */
  isSquareAttacked(row, col, byColor) {
    const opponentColor = byColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    // Check knight attacks
    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of knightMoves) {
      const piece = this.getPiece(row + dr, col + dc);
      if (piece && piece.type === PIECES.KNIGHT && piece.color === opponentColor) return true;
    }
    
    // Check king attacks (adjacent squares)
    const kingMoves = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of kingMoves) {
      const piece = this.getPiece(row + dr, col + dc);
      if (piece && piece.type === PIECES.KING && piece.color === opponentColor) return true;
    }
    
    // Check pawn attacks
    const pawnDir = byColor === COLORS.WHITE ? -1 : 1;
    for (const dc of [-1, 1]) {
      const piece = this.getPiece(row + pawnDir, col + dc);
      if (piece && piece.type === PIECES.PAWN && piece.color === opponentColor) return true;
    }
    
    // Check sliding pieces (bishop, rook, queen)
    const bishopDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for (const [dr, dc] of bishopDirs) {
      let nr = row + dr, nc = col + dc;
      while (this.isInBounds(nr, nc)) {
        const piece = this.getPiece(nr, nc);
        if (piece) {
          if (piece.color === opponentColor && 
              (piece.type === PIECES.BISHOP || piece.type === PIECES.QUEEN)) return true;
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
    
    const rookDirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of rookDirs) {
      let nr = row + dr, nc = col + dc;
      while (this.isInBounds(nr, nc)) {
        const piece = this.getPiece(nr, nc);
        if (piece) {
          if (piece.color === opponentColor && 
              (piece.type === PIECES.ROOK || piece.type === PIECES.QUEEN)) return true;
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
    
    return false;
  }

  /**
   * Check if moving would leave king in check
   */
  wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
    // Make the move on a copy of the board
    const boardCopy = this.board.map(row => row.map(piece => piece ? { ...piece } : null));
    const capturedPiece = boardCopy[toRow][toCol];
    boardCopy[toRow][toCol] = boardCopy[fromRow][fromCol];
    boardCopy[fromRow][fromCol] = null;
    
    // Handle en passant capture
    if (this.getPiece(fromRow, fromCol) && this.getPiece(fromRow, fromCol).type === PIECES.PAWN &&
        toCol !== fromCol && !capturedPiece) {
      // En passant - remove the captured pawn
      boardCopy[fromRow][toCol] = null;
    }
    
    // Find king position
    let kingRow = -1, kingCol = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (boardCopy[r][c] && boardCopy[r][c].type === PIECES.KING && boardCopy[r][c].color === color) {
          kingRow = r;
          kingCol = c;
          break;
        }
      }
      if (kingRow >= 0) break;
    }
    
    // Check if king is in check on the new board
    return this.isSquareAttackedOnBoard(boardCopy, kingRow, kingCol, color);
  }

  /**
   * Check if a square is attacked on a specific board state
   */
  isSquareAttackedOnBoard(board, row, col, byColor) {
    const opponentColor = byColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of knightMoves) {
      const [nr, nc] = [row + dr, col + dc];
      if (this.isInBounds(nr, nc) && board[nr][nc] && 
          board[nr][nc].type === PIECES.KNIGHT && board[nr][nc].color === opponentColor) return true;
    }
    
    const kingMoves = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of kingMoves) {
      const [nr, nc] = [row + dr, col + dc];
      if (this.isInBounds(nr, nc) && board[nr][nc] && 
          board[nr][nc].type === PIECES.KING && board[nr][nc].color === opponentColor) return true;
    }
    
    const pawnDir = byColor === COLORS.WHITE ? -1 : 1;
    for (const dc of [-1, 1]) {
      const [nr, nc] = [row + pawnDir, col + dc];
      if (this.isInBounds(nr, nc) && board[nr][nc] && 
          board[nr][nc].type === PIECES.PAWN && board[nr][nc].color === opponentColor) return true;
    }
    
    const bishopDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for (const [dr, dc] of bishopDirs) {
      let nr = row + dr, nc = col + dc;
      while (this.isInBounds(nr, nc)) {
        if (board[nr][nc]) {
          if (board[nr][nc].color === opponentColor && 
              (board[nr][nc].type === PIECES.BISHOP || board[nr][nc].type === PIECES.QUEEN)) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }
    
    const rookDirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of rookDirs) {
      let nr = row + dr, nc = col + dc;
      while (this.isInBounds(nr, nc)) {
        if (board[nr][nc]) {
          if (board[nr][nc].color === opponentColor && 
              (board[nr][nc].type === PIECES.ROOK || board[nr][nc].type === PIECES.QUEEN)) return true;
          break;
        }
        nr += dr; nc += dc;
      }
    }
    
    return false;
  }

  /**
   * Find king position for a color
   */
  findKing(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.type === PIECES.KING && piece.color === color) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  /**
   * Check if current player is in check
   */
  isInCheck(color) {
    const king = this.findKing(color);
    if (!king) return false;
    return this.isSquareAttacked(king.row, king.col, color);
  }

  /**
   * Check if current player has any legal moves
   */
  hasLegalMoves(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.color === color) {
          const moves = this.getLegalMoves(r, c);
          if (moves.length > 0) return true;
        }
      }
    }
    return false;
  }

  /**
   * Execute a move
   */
  makeMove(fromRow, fromCol, toRow, toCol, promotionType = null) {
    const piece = this.getPiece(fromRow, fromCol);
    if (!piece) {
      return { success: false, error: 'No piece at source position' };
    }
    
    if (piece.color !== this.currentTurn) {
      return { success: false, error: `It's ${this.currentTurn}'s turn` };
    }
    
    // Get legal moves
    const legalMoves = this.getLegalMoves(fromRow, fromCol);
    const move = legalMoves.find(m => m.toRow === toRow && m.toCol === toCol);
    
    if (!move) {
      return { success: false, error: 'Illegal move' };
    }
    
    // Execute the move
    const capturedPiece = this.board[toRow][toCol];
    const moveRecord = {
      piece: { ...piece },
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      captured: capturedPiece ? { ...capturedPiece } : null,
      timestamp: new Date(),
    };
    
    // Handle captures
    if (capturedPiece) {
      this.capturedPieces[this.currentTurn].push(capturedPiece);
    }
    
    // Handle en passant
    if (move.isEnPassant) {
      const capturedPawn = this.board[fromRow][toCol];
      if (capturedPawn) {
        this.capturedPieces[this.currentTurn].push(capturedPawn);
      }
      this.board[fromRow][toCol] = null;
      moveRecord.isEnPassant = true;
      moveRecord.enPassantCaptured = { ...capturedPawn };
    }
    
    // Move the piece
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;
    
    // Handle castling
    if (move.isCastling) {
      if (move.isCastling === 'kingSide') {
        this.board[fromRow][5] = this.board[fromRow][7]; // Move rook
        this.board[fromRow][7] = null;
      } else {
        this.board[fromRow][3] = this.board[fromRow][0]; // Move rook
        this.board[fromRow][0] = null;
      }
      moveRecord.isCastling = move.isCastling;
    }
    
    // Handle pawn promotion
    if (move.promotion) {
      this.board[toRow][toCol] = { type: move.promotion, color: this.currentTurn };
      moveRecord.promotion = move.promotion;
    }
    
    // Handle double pawn push (en passant target)
    this.enPassantTarget = null;
    if (piece.type === PIECES.PAWN && Math.abs(toRow - fromRow) === 2) {
      this.enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
    }
    
    // Update castling rights
    if (piece.type === PIECES.KING) {
      const side = this.currentTurn;
      this.castlingRights[side].kingSide = false;
      this.castlingRights[side].queenSide = false;
    }
    if (piece.type === PIECES.ROOK) {
      const side = this.currentTurn;
      if (fromCol === 0) this.castlingRights[side].queenSide = false;
      if (fromCol === 7) this.castlingRights[side].kingSide = false;
    }
    
    // Update move history
    this.moveHistory.push(moveRecord);
    this.lastMove = moveRecord;
    
    // Reset half-move clock on pawn move or capture
    if (piece.type === PIECES.PAWN || capturedPiece) {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }
    
    // Update full move number
    if (this.currentTurn === COLORS.BLACK) {
      this.fullMoveNumber++;
    }
    
    // Switch turns
    this.currentTurn = this.currentTurn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    // Update game status
    this.updateGameStatus();
    
    // Update timer
    if (this.timeControl > 0) {
      const now = Date.now();
      const elapsed = (now - this.lastMoveTime) / 1000;
      const prevColor = piece.color;
      this.timers[prevColor] -= elapsed;
      if (this.timers[prevColor] <= 0) {
        this.timers[prevColor] = 0;
        this.gameStatus = 'timeout';
        this.winner = prevColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        this.winReason = 'timeout';
      }
      this.lastMoveTime = now;
    }
    
    return {
      success: true,
      move: moveRecord,
      gameStatus: this.gameStatus,
      winner: this.winner || null,
      winReason: this.winReason || null,
      currentTurn: this.currentTurn,
    };
  }

  /**
   * Update game status (check, checkmate, stalemate)
   */
  updateGameStatus() {
    const inCheck = this.isInCheck(this.currentTurn);
    const hasLegalMoves = this.hasLegalMoves(this.currentTurn);
    
    if (inCheck && !hasLegalMoves) {
      // Checkmate
      this.gameStatus = 'checkmate';
      this.winner = this.currentTurn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
      this.winReason = 'checkmate';
    } else if (!inCheck && !hasLegalMoves) {
      // Stalemate
      this.gameStatus = 'stalemate';
      this.winner = null;
      this.winReason = 'stalemate';
    } else if (inCheck) {
      this.gameStatus = 'check';
      this.checkSquare = this.findKing(this.currentTurn);
    } else {
      this.gameStatus = 'playing';
      this.checkSquare = null;
    }
    
    // Check for insufficient material (draw)
    if (this.isInsufficientMaterial()) {
      this.gameStatus = 'draw';
      this.winReason = 'insufficient_material';
    }
  }

  /**
   * Check for insufficient material (draw)
   */
  isInsufficientMaterial() {
    const pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c]) pieces.push(this.board[r][c]);
      }
    }
    
    if (pieces.length === 2) return true; // King vs King
    if (pieces.length === 3) {
      // King + minor piece vs King
      const nonKing = pieces.find(p => p.type !== PIECES.KING);
      if (nonKing && (nonKing.type === PIECES.BISHOP || nonKing.type === PIECES.KNIGHT)) return true;
    }
    if (pieces.length === 4) {
      const bishops = pieces.filter(p => p.type === PIECES.BISHOP);
      if (bishops.length === 2) {
        // Both bishops on same color
        return bishops.every(b => (b.color === 'white' ? true : false)); // Simplified check
      }
    }
    return false;
  }

  /**
   * Get board state for display
   */
  getBoardState() {
    return {
      board: this.board,
      currentTurn: this.currentTurn,
      gameStatus: this.gameStatus,
      winner: this.winner || null,
      winReason: this.winReason || null,
      capturedPieces: this.capturedPieces,
      moveHistory: this.moveHistory,
      lastMove: this.lastMove,
      timers: this.timers,
      fullMoveNumber: this.fullMoveNumber,
      checkSquare: this.checkSquare,
      fen: this.toFen(),
    };
  }

  /**
   * Convert board to FEN notation
   */
  toFen() {
    let fen = '';
    for (let r = 0; r < 8; r++) {
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (!piece) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          const pieceChar = piece.type[0].toUpperCase();
          fen += piece.color === COLORS.WHITE ? pieceChar : pieceChar.toLowerCase();
        }
      }
      if (emptyCount > 0) fen += emptyCount;
      if (r < 7) fen += '/';
    }
    
    fen += ` ${this.currentTurn[0]}`;
    
    // Castling availability
    let castling = '';
    if (this.castlingRights.white.kingSide) castling += 'K';
    if (this.castlingRights.white.queenSide) castling += 'Q';
    if (this.castlingRights.black.kingSide) castling += 'k';
    if (this.castlingRights.black.queenSide) castling += 'q';
    fen += ` ${castling || '-'}`;
    
    // En passant
    fen += ` ${this.enPassantTarget ? String.fromCharCode(97 + this.enPassantTarget.col) + (8 - this.enPassantTarget.row) : '-'}`;
    
    // Half-move clock and full-move number
    fen += ` ${this.halfMoveClock} ${this.fullMoveNumber}`;
    
    return fen;
  }

  /**
   * Load position from FEN
   */
  loadFromFen(fen) {
    const parts = fen.split(' ');
    const boardPart = parts[0];
    const rows = boardPart.split('/');
    
    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const char of rows[r]) {
        if (char >= '1' && char <= '8') {
          c += parseInt(char);
        } else {
          const isWhite = char === char.toUpperCase();
          const typeMap = { 'K': PIECES.KING, 'Q': PIECES.QUEEN, 'R': PIECES.ROOK, 
                           'B': PIECES.BISHOP, 'N': PIECES.KNIGHT, 'P': PIECES.PAWN };
          this.board[r][c] = { 
            type: typeMap[char.toUpperCase()], 
            color: isWhite ? COLORS.WHITE : COLORS.BLACK 
          };
          c++;
        }
      }
    }
    
    this.currentTurn = parts[1] === 'w' ? COLORS.WHITE : COLORS.BLACK;
    
    // Parse castling
    this.castlingRights = {
      white: { kingSide: parts[2].includes('K'), queenSide: parts[2].includes('Q') },
      black: { kingSide: parts[2].includes('k'), queenSide: parts[2].includes('q') },
    };
    
    // Parse en passant
    if (parts[3] !== '-') {
      this.enPassantTarget = {
        col: parts[3].charCodeAt(0) - 97,
        row: 8 - parseInt(parts[3][1]),
      };
    }
    
    this.halfMoveClock = parseInt(parts[4]) || 0;
    this.fullMoveNumber = parseInt(parts[5]) || 1;
  }

  /**
   * Get move notation (algebraic notation)
   */
  getMoveNotation(move) {
    const piece = move.piece;
    const pieceChar = {
      [PIECES.KING]: 'K', [PIECES.QUEEN]: 'Q', [PIECES.ROOK]: 'R',
      [PIECES.BISHOP]: 'B', [PIECES.KNIGHT]: 'N', [PIECES.PAWN]: '',
    }[piece.type] || '';
    
    const fromSquare = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
    const toSquare = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
    
    if (move.isCastling === 'kingSide') return 'O-O';
    if (move.isCastling === 'queenSide') return 'O-O-O';
    
    let notation = pieceChar;
    if (move.captured || move.isEnPassant) {
      if (piece.type === PIECES.PAWN) notation = fromSquare[0];
      notation += 'x';
    }
    notation += toSquare;
    if (move.promotion) notation += '=' + { queen: 'Q', rook: 'R', bishop: 'B', knight: 'N' }[move.promotion];
    
    // Check/checkmate symbols would be added by the caller
    
    return notation;
  }
}

module.exports = { ChessEngine, PIECES, COLORS, UNICODE_PIECES };
