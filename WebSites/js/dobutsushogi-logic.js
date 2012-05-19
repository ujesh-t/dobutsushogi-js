
"use strict";

// ----------------------------------------------------------------------------------------------
// Mersenne Twister
// ----------------------------------------------------------------------------------------------
var MT = new MersenneTwister();

// ----------------------------------------------------------------------------------------------
// Utility
// ----------------------------------------------------------------------------------------------
// 配列探索（自作オブジェクトでequalsを実装しているもののみ）
Array.prototype.myIndexOf = function (obj) {
    if (this.length == 0)
        return -1;
    if (obj == null)
        return -1;
    for (var i = 0; i < this.length; i++) {
        if (this[i].equals(obj))
            return i;
    }
    return -1;
};
Array.prototype.getRandomItem = function () {
    return this[~ ~(Math.random() * this.length)];
};
Array.prototype.removeAt = function (index) {
    Array.prototype.splice.apply(this, [i, 1]);
    return this;
};
Array.prototype.remove = function (value) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === value) {
            this.splice(i, 1);
        }
    }
    return this;
};
Array.prototype.clone = function () {
    return Array.apply(null, this);
}
$.extend({
    format: function (fmt) {
        for (var i = 1; i < arguments.length; i++) {
            var reg = new RegExp("\\{" + (i - 1) + "\\}", "g");
            fmt = fmt.replace(reg, arguments[i]);
        }
        return fmt;
    }
});



// ----------------------------------------------------------------------------------------------
// PlayerTurn
// ----------------------------------------------------------------------------------------------
var PlayerTurn = {
    man: 0,
    com: 1
};
PlayerTurn.invert = function (value) {
    return (value + 1) % 2;
};

// ----------------------------------------------------------------------------------------------
// Piece
// ----------------------------------------------------------------------------------------------
var Piece = {
    empty: 0,
    hiyoko: 1,
    niwatori: 2,
    kirin: 3,
    zo: 4,
    lion: 5,
    man: 8,
    com: 16,

    hiyoko0: 1 + 8,
    niwatori0: 2 + 8,
    kirin0: 3 + 8,
    zo0: 4 + 8,
    lion0: 5 + 8,

    hiyoko1: 1 + 16,
    niwatori1: 2 + 16,
    kirin1: 3 + 16,
    zo1: 4 + 16,
    lion1: 5 + 16
};
// 駒の動き
Piece.movement = new Array(Piece.lion + Piece.com);
//Piece.movement[Piece.empty] = null;
Piece.movement[Piece.hiyoko0] = [
    false, true, false,
    false, false, false,
    false, false, false];
Piece.movement[Piece.niwatori0] = [
    true, true, true,
    true, false, true,
    false, true, false];
Piece.movement[Piece.kirin0] = [
    false, true, false,
    true, false, true,
    false, true, false];
Piece.movement[Piece.zo0] = [
    true, false, true,
    false, false, false,
    true, false, true];
Piece.movement[Piece.lion0] = [
    true, true, true,
    true, false, true,
    true, true, true];
Piece.movement[Piece.hiyoko1] = [
    false, false, false,
    false, false, false,
    false, true, false];
Piece.movement[Piece.niwatori1] = [
    false, true, false,
    true, false, true,
    true, true, true];
Piece.movement[Piece.kirin1] = Piece.movement[Piece.kirin0];
Piece.movement[Piece.zo1] = Piece.movement[Piece.zo0];
Piece.movement[Piece.lion1] = Piece.movement[Piece.lion0];

Piece.create = function (type, turn) {
    return type + ((turn + 1) * 8);
};
Piece.type = function (piece) {
    return piece & 7;
};
Piece.turn = function (piece) {
    return piece < Piece.com ? 0 : 1;
};
Piece.isPiece = function (piece) {
    return piece > 0;
};
Piece.nameArray = ["", "ひよこ", "にわとり", "きりん", "ぞう", "ライオン"];
Piece.name = function (piece) {
    return Piece.nameArray[Piece.type(piece)];
};
Piece.imagePathArray = ["", "hiyoko", "niwatori", "kirin", "zo", "lion"];
Piece.imagePath = function (piece) {
    return "img/" + Piece.imagePathArray[Piece.type(piece)] + Piece.turn(piece) + ".png";
};
Piece.isMan = function (piece) {
    return (piece & Piece.man) != 0;
};
Piece.isCom = function (piece) {
    return (piece & Piece.com) != 0;
};
Piece.isSelf = function (piece, turn) {
    if (turn == PlayerTurn.man)
        return Piece.isMan(piece);
    else
        return Piece.isCom(piece);
};
Piece.isEnemy = function (piece, turn) {
    if (turn == PlayerTurn.man)
        return Piece.isCom(piece);
    else
        return Piece.isMan(piece);
};
Piece.convert = function (piece) {
    if (Piece.isMan(piece))
        return piece + 8;
    else
        return piece - 8;
};
Piece.promote = function (piece) {
    if (Piece.type(piece) == Piece.hiyoko)
        return Piece.create(Piece.niwatori, Piece.turn(piece));
    else
        return piece;
};
Piece.demote = function (piece) {
    if (Piece.type(piece) == Piece.niwatori)
        return Piece.create(Piece.hiyoko, Piece.turn(piece));
    else
        return piece;
};
Piece.eachMovement = function (piece, func) {
    if (!Piece.isPiece(piece))
        return;
    var m = Piece.movement[piece];
    for (var r = 0; r <= 2; r++) {
        for (var c = 0; c <= 2; c++) {
            if (m[r * 3 + c]) {
                func(r - 1, c - 1);
            }
        }
    }
};
Piece.evaluateTable = [0, 2, 4, 7, 7, 100];
Piece.evaluate = function (piece, row, col) {
    piece = piece || 0;
    var type = Piece.type(piece);
    var turn = Piece.turn(piece);
    var value = Piece.evaluateTable[type];

    switch (type) {
        case Piece.hiyoko:
            if (turn == PlayerTurn.man && row == 0) value = -1;
            else if (turn == PlayerTurn.com && row == 3) value = -1;
            break;
        case Piece.lion:
            // トライ加点
            if (turn == PlayerTurn.man) {
                switch (row) {
                    case 0: value += 50; break;
                    case 1: value += 5; break;
                    case 2: value -= 2; break;
                }
            }
            else {
                switch (row) {
                    case 3: value += 50; break;
                    case 2: value += 5; break;
                    case 1: value -= 2; break;
                }
            }
            break;
    }
    return value;
}
Piece.toString = function (piece) {
    switch (Piece.type(piece)) {
        case Piece.hiyoko: return "H";
        case Piece.niwatori: return "N";
        case Piece.kirin: return "K";
        case Piece.zo: return "Z";
        case Piece.lion: return "L";
        case Piece.empty: return "_";
    }
    return "";
}



// ----------------------------------------------------------------------------------------------
// BoardPosition
// ----------------------------------------------------------------------------------------------
var BoardPosition = function (row, col) {
    this.row = row;
    this.col = col;
};

BoardPosition.empty = new BoardPosition(-1, -1);
BoardPosition.fromCoordinate = function (pos) {
    var row = Math.floor((pos.top + 40) / 80);
    var col = Math.floor((pos.left + 40) / 80);
    return new BoardPosition(row, col);
};


BoardPosition.prototype = {
    equals: function (obj) {
        return this.row == obj.row && this.col == obj.col;
    },
    isPromotable: function (turn) {
        switch (turn) {
            case PlayerTurn.man: return this.row == 0;
            case PlayerTurn.com: return this.row == 3;
        }
    },
    isValid: function () {
        return this.row >= 0 && this.row < 4 && this.col >= 0 && this.col < 3;
    },
    toIndex: function () {
        return (this.row << 2) + this.col;
    },
    toString: function () {
        return "(" + this.row + ", " + this.col + ")";
    }
};

// ----------------------------------------------------------------------------------------------
// PieceChange
// ----------------------------------------------------------------------------------------------
var PieceChange = function (got, moved) {
    this.got = got;
    this.moved = moved;
};

// ----------------------------------------------------------------------------------------------
// Board
// ----------------------------------------------------------------------------------------------
var Board = function () {
    this.data = arguments[0];
    this.hand = arguments[1];
    this.turn = arguments[2];
    this.sphere = null;
    switch (arguments.length) {
        case 4:
            this.sphere = arguments[3];
            break;
        case 3:
            this.refreshSpheres();
            break;
        default:
            alert("fatal error at Board constructor");
    }
};
// Initial board states
Board.createDefaultBoard = function () {
    var data = [
        Piece.kirin1, Piece.lion1, Piece.zo1, void 0,
        Piece.empty, Piece.hiyoko1, Piece.empty, void 0,
        Piece.empty, Piece.hiyoko0, Piece.empty, void 0,
        Piece.zo0, Piece.lion0, Piece.kirin0, void 0
    ];
    var hand = [[], []];
    var turn = PlayerTurn.man;
    return new Board(data, hand, turn);
};
Board.createTestBoard1 = function () {
    var data = [
        Piece.empty, Piece.lion1, Piece.empty, void 0,
        Piece.empty, Piece.empty, Piece.empty, void 0,
        Piece.empty, Piece.empty, Piece.empty, void 0,
        Piece.zo0, Piece.lion0, Piece.kirin0, void 0
    ];
    var hand = [[], []];
    var turn = PlayerTurn.man;
    return new Board(data, hand, turn);
};
Board.createTestBoard2 = function () {
    var data = [
        Piece.empty, Piece.empty, Piece.empty, void 0,
        Piece.empty, Piece.empty, Piece.lion0, void 0,
        Piece.lion1, Piece.hiyoko1, Piece.empty, void 0,
        Piece.empty, Piece.empty, Piece.empty, void 0
    ];
    var hand = [[], []];
    var turn = PlayerTurn.man;
    return new Board(data, hand, turn);
};



Board.prototype = {
    get: function (pos) {
        return this.data[(pos.row << 2) + pos.col];
    },
    set: function (pos, value) {
        this.data[(pos.row << 2) + pos.col] = value;
    },

    refreshSpheres: function () {
        var data = this.data;
        var self = this;
        this.sphere = [
            [0, 0, 0, (void 0), 0, 0, 0, (void 0), 0, 0, 0, (void 0), 0, 0, 0, (void 0)],
            [0, 0, 0, (void 0), 0, 0, 0, (void 0), 0, 0, 0, (void 0), 0, 0, 0, (void 0)]
        ];
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                var piece = data[(r << 2) + c];
                if (piece > 0) {
                    var turn = Piece.turn(piece);
                    Piece.eachMovement(piece, function (dr, dc) {
                        self.sphere[turn][((r + dr) << 2) + (c + dc)]++;
                    });
                }
            }
        }
    },

    clone: function () {
        var data = this.data.slice(0, 16);
        var hand0 = this.hand[0].slice(0);
        var hand1 = this.hand[1].slice(0);
        var turn = this.turn;
        var sphere0 = this.sphere[0].slice(0, 16);
        var sphere1 = this.sphere[1].slice(0, 16);
        return new Board(data, [hand0, hand1], turn, [sphere0, sphere1]);
    },

    move: function (beforePos, afterPos, turn) {
        var currentPiece = Piece.demote(this.data[(afterPos.row << 2) + afterPos.col]); // 今ある駒
        var movingPiece = this.data[(beforePos.row << 2) + beforePos.col];  // 移動する駒
        var sp;
        // 成る
        if (afterPos.isPromotable(turn)) {
            movingPiece = Piece.promote(movingPiece);
        }
        // 移動
        this.data[(afterPos.row << 2) + afterPos.col] = movingPiece;
        this.data[(beforePos.row << 2) + beforePos.col] = Piece.empty;
        // 敵の駒を取っている
        if (currentPiece != Piece.empty) {
            // 取られた敵の勢力圏変更
            sp = this.sphere[PlayerTurn.invert(turn)];
            Piece.eachMovement(currentPiece, function (dr, dc) {
                sp[((afterPos.row + dr) << 2) + (afterPos.col + dc)]--;
            });
            // 成りを戻し、味方にconvertして手駒追加
            currentPiece = Piece.convert(Piece.demote(currentPiece));
            this.hand[turn].push(currentPiece);
        }
        // 移動前の箇所から勢力圏を消し、新しい場所に設定
        sp = this.sphere[turn];
        Piece.eachMovement(movingPiece, function (dr, dc) {
            sp[((beforePos.row + dr) << 2) + (beforePos.col + dc)]--;
            sp[((afterPos.row + dr) << 2) + (afterPos.col + dc)]++;
        });
        return new PieceChange(currentPiece, movingPiece);
    },
    place: function (pos, piece, turn) {
        this.data[(pos.row << 2) + pos.col] = piece;
        this.hand[turn].remove(piece);
        // 影響度を加算
        var sp = this.sphere[turn];
        Piece.eachMovement(piece, function (dr, dc) {
            sp[((pos.row + dr) << 2) + (pos.col + dc)]++;
        });
    },

    toggleTurn: function () {
        this.turn = PlayerTurn.invert(this.turn);
        return this;
    },

    eachPiece: function (func) {
        var piece;
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                piece = this.data[(r << 2) + c];
                if (piece != Piece.empty) {
                    func(piece, r, c);
                }
            }
        }
    },

    getPiecePositions: function (turn) {
        var result = [];
        var piece;
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                piece = this.data[(r << 2) + c];
                if (Piece.isSelf(piece, turn)) {
                    result.push(new BoardPosition(r, c));
                }
            }
        }
        return result;
    },

    getMovablePositions: function () {
        var row, col, turn;
        if (arguments.length == 2) {
            row = arguments[0].row;
            col = arguments[0].col;
            turn = arguments[1];
        } else if (arguments.length == 3) {
            row = arguments[0];
            col = arguments[1];
            turn = arguments[2];
        }
        var result = [];
        var piece = this.data[(row << 2) + col];
        if (piece != Piece.empty) {
            var _self = this;
            Piece.eachMovement(piece, function (dr, dc) {
                var aroundPos = new BoardPosition(row + dr, col + dc);
                var aroundCell = _self.data[(aroundPos.row << 2) + aroundPos.col];
                // aroundCellは境界外ではundefined. でもチェックはいらなさそう。
                if (aroundCell == Piece.empty || Piece.isEnemy(aroundCell, turn)) {
                    result.push(aroundPos);
                }
            });
        }
        return result;
    },

    getPlaceablePositions: function () {
        var result = [];
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                if (this.data[(r << 2) + c] == Piece.empty) {
                    result.push(new BoardPosition(r, c));
                }
            }
        }
        return result;
    },

    isChecked: function (turn) {
        var enemyTurn = PlayerTurn.invert(turn);
        var enemyPiecePositions = this.getPiecePositions(enemyTurn);
        for (var i = 0; i < enemyPiecePositions.length; i++) {
            var enemyMovablePositions = this.getMovablePositions(enemyPiecePositions[i], enemyTurn);
            for (var j = 0; j < enemyMovablePositions.length; j++) {
                var pos = enemyMovablePositions[j];
                var piece = this.data[(pos.row << 2) + pos.col];
                if (Piece.isSelf(piece, turn) && Piece.type(piece) == Piece.lion) {
                    return true;
                }
            }
        }
        return false;
    },

    isSelfPiece: function (pos) {
        var piece = this.data[(pos.row << 2) + pos.col];
        return Piece.isSelf(piece, this.turn);
    },

    isDeadLion: function (turn) {
        var myLion = Piece.create(Piece.lion, turn);
        var data = this.data;
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                var piece = data[(r << 2) + c];
                if (piece == myLion) {
                    return false;
                }
            }
        }
        return true;
    },
    triesLion: function (turn) {
        var myLion = Piece.create(Piece.lion, turn);
        var r = (turn == PlayerTurn.man) ? 0 : 3;
        var data = this.data;
        for (var c = 0; c < 3; c++) {
            var piece = data[(r << 2) + c];
            if (piece == myLion) {
                return true;
            }
        }
        return false;
    },

    // posにある駒に効いているturnの駒があるかどうか
    getSphereCount: function () {
        var row, col, turn;
        if (arguments.length == 2) {
            row = arguments[0].row;
            col = arguments[0].col;
            turn = arguments[1];
        } else if (arguments.length == 3) {
            row = arguments[0];
            col = arguments[1];
            turn = arguments[2];
        }
        return this.sphere[turn][(row << 2) + col];
    },
    evaluate: function () {
        var ret = 0;
        var data = this.data;
        var sp0 = this.sphere[0];
        var sp1 = this.sphere[1];
        // 盤上の駒の価値
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                var piece = data[(r << 2) + c];
                if (piece > 0) {
                    var myTurn = Piece.turn(piece);
                    var enemyTurn = PlayerTurn.invert(myTurn);
                    var val = Piece.evaluate(piece, r, c);

                    // 駒の効き具合を加算
                    var es = this.getSphereCount(r, c, enemyTurn) * 1;
                    var ms = this.getSphereCount(r, c, myTurn) * 1;
                    val = val + ms - es;

                    if (Piece.isCom(piece)) {
                        val *= -1;
                    }
                    ret += val;
                }
                ret = ret + sp0[(r << 2) + c] - sp1[(r << 2) + c];
            }
        }
        // 手駒の価値
        var hand = this.hand;
        var i;
        for (i = 0; i < hand[0].length; i++) {
            ret += Piece.evaluate(hand[0][i]);
        }
        for (i = 0; i < hand[1].length; i++) {
            ret -= Piece.evaluate(hand[1][i]);
        }
        return ret;
    },

    inspect: function () {
        var str = "";
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                var piece = this.data[(r << 2) + c];
                var ch = Piece.toString(piece);
                if (Piece.isCom(piece))
                    ch = ch.toLowerCase();
                str += ch;
            }
            str += "\n";
        }
        return str;
    }
};

// ----------------------------------------------------------------------------------------------
// Move
// ----------------------------------------------------------------------------------------------
var Move = function (fromPos, toPos) {
    this.fromPos = fromPos;
    this.toPos = toPos;
};
Move.prototype = {
    toString: function () {
        var f = this.fromPos;
        var t = this.toPos;
        return $.format("({0},{1})->({2},{3})", f.row, f.col, t.row, t.col);
    }
};

// ----------------------------------------------------------------------------------------------
// Place
// ----------------------------------------------------------------------------------------------
var Place = function (pos, piece, handIndex) {
    this.pos = pos;
    this.piece = piece;
    this.handIndex = handIndex; // optional
};
Place.prototype = {
    toString: function () {
        return $.format("({0})->({1},{2})", Piece.toString(this.piece), this.pos.row, this.pos.col);
    }
};

// ----------------------------------------------------------------------------------------------
// AICandidate
// ----------------------------------------------------------------------------------------------
var AICandidateType = {
    empty: 0, move: 1, place: 2
};
var AICandidate = function (type, content, board, nextBoard) {
    this.type = type;
    this.content = content;
    this.board = board;
    this.nextBoard = nextBoard;
};
AICandidate.create = function (type, content, currentBoard, turn) {
    var nextBoard = currentBoard.clone();
    nextBoard.toggleTurn();
    switch (type) {
        case AICandidateType.move:
            nextBoard.move(content.fromPos, content.toPos, turn);
            break;
        case AICandidateType.place:
            nextBoard.place(content.pos, content.piece, turn);
            break;
    }
    return new AICandidate(type, content, currentBoard, nextBoard);
};
AICandidate.prototype = {
    replace: function (newObj) {
        this.type = newObj.type;
        this.content = newObj.content;
        this.board = newObj.board;
        this.nextBoard = newObj.nextBoard;
    }
    /*
    toString: function () {
    return this.content.toString();
    }*/
};

// ----------------------------------------------------------------------------------------------
// AI
// ----------------------------------------------------------------------------------------------
var AIEngine = function (board) {
    this.board = board;
    this.nodeNum = 0;
};
AIEngine.prototype = {
    think: function () {
        return null;
    },

    getMoves: function (board, turn) {
        var ret = [];

        var data = board.data;
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                var piece = data[(r << 2) + c];
                if (Piece.isSelf(piece, turn)) {
                    var pos = new BoardPosition(r, c);
                    Piece.eachMovement(piece, function (dr, dc) {
                        var aroundPos = new BoardPosition(r + dr, c + dc);
                        var aroundCell = data[(aroundPos.row << 2) + aroundPos.col];
                        if (aroundCell == Piece.empty || Piece.isEnemy(aroundCell, turn)) {
                            ret.push(new Move(pos, aroundPos));
                        }
                    });
                }
            }
        }

        return ret;
    },
    getMoveCandidates: function (board) {
        var candidates = [];
        var moves = this.getMoves(board, board.turn);
        for (var i = 0; i < moves.length; i++) {
            var c = AICandidate.create(AICandidateType.move, moves[i], board, board.turn);
            candidates.push(c);
        }
        return candidates;
    },
    getPlaces: function (board, turn) {
        var ret = [];
        var hand = board.hand;
        var placeablePositions = board.getPlaceablePositions();
        for (var i = 0; i < placeablePositions.length; i++) {
            // 置ける手を全部列挙
            var myhand = hand[turn];
            for (var j = 0; j < myhand.length; j++) {
                var p = new Place(placeablePositions[i], myhand[j]);
                ret.push(p);
            }
        }
        return ret;
    },
    getPlaceCandidates: function (board) {
        var candidates = [];
        var places = this.getPlaces(board, board.turn);
        for (var i = 0; i < places.length; i++) {
            var c = AICandidate.create(AICandidateType.place, places[i], board, board.turn);
            candidates.push(c);
        }
        return candidates;
    },

    findCatchingLionMove: function (candidates, turn) {
        var data = this.board.data;
        for (var i = 0; i < candidates.length; i++) {
            var toPos = candidates[i].content.toPos;
            var piece = data[(toPos.row << 2) + toPos.col];
            if (Piece.isEnemy(piece, turn) && Piece.type(piece) == Piece.lion) {
                return candidates[i];
            }
        }
        return null;
    },

    filterSuicide: function (candidates) {
        if (candidates.length <= 1) {
            return;
        }
        var myTurn = candidates[0].board.turn;
        for (var i = candidates.length - 1; i >= 0; i--) {
            // 今のcandidatesのようにためしに動かしてみて、取られるかどうか
            var nextBoard = candidates[i].nextBoard;
            // 敵があらゆる手でライオンを取れないかチェック
            var enemyMovements = this.getMoves(nextBoard, nextBoard.turn);
            for (var j = 0; j < enemyMovements.length; j++) {
                var toPos = enemyMovements[j].toPos;
                var piece = nextBoard.data[(toPos.row << 2) + toPos.col];
                if (Piece.isSelf(piece, myTurn) && Piece.type(piece) == Piece.lion) {
                    candidates.splice(i, 1);
                    if (candidates.length == 1) {
                        return;
                    }
                    break;
                }
            }
        }
    },

    getProperCandidates: function (board) {
        // 動かせる手を全部列挙
        var candidates = this.getMoveCandidates(board);

        // ライオンを取れる手があればそれで決定
        var catchingLionmove = this.findCatchingLionMove(candidates, board.turn);
        if (catchingLionmove != null)
            return [catchingLionmove];

        // 自分から死に行く手は消す
        this.filterSuicide(candidates);

        // 王手がかっていないなら、駒を置く手も考える
        if (!board.isChecked(board.turn)) {
            // 置ける手を全部列挙し追加
            [ ].push.apply(candidates, this.getPlaceCandidates(board));
        }
        return candidates;
    },

    negaMax: function (board, depth, outCandidate) {
        // 最大深さに達していれば再帰終わり
        if (depth <= 0) {
            return (board.turn == PlayerTurn.man) ? board.evaluate() : -board.evaluate();
        }
        this.nodeNum++;

        // 動かせる手を全部列挙
        var candidates = this.getProperCandidates(board);

        // 最大の評価点のものを選ぶ
        var maxVal = -0xffff;
        var maxCandidates = [];

        for (var i = 0; i < candidates.length; i++) {
            // 次の局面について、maxでさらに先読み
            var e = -this.negaMax(candidates[i].nextBoard, depth - 1, null);
            if (maxVal < e) {
                maxVal = e;
                maxCandidates.length = 0;
            }
            if (maxVal == e) {
                maxCandidates.push(candidates[i]);
            }
            if (outCandidate) {
                var a = maxCandidates.getRandomItem();
                outCandidate.replace(maxCandidates.getRandomItem());
            }
        }
        return maxVal;
    },

    negaAlphaBeta: function (board, depth, alpha, beta, outCandidate) {
        // 最大深さに達していれば再帰終わり
        if (depth <= 0) {
            return (board.turn == PlayerTurn.man) ? board.evaluate() : -board.evaluate();
        }
        this.nodeNum++;

        // 動かせる手を全部列挙
        var candidates = this.getProperCandidates(board);

        // 最大の評価点のものを選ぶ
        var maxVal = -0xffff;
        for (var i = 0; i < candidates.length; i++) {
            // 次の局面について先読み
            var e = -this.negaAlphaBeta(candidates[i].nextBoard, depth - 1, -beta, -alpha, null);
            if (maxVal < e) {
                maxVal = e;
                if (alpha < e) {
                    alpha = e;
                }
                if (outCandidate) {
                    outCandidate.replace(candidates[i]);
                }
                if (e >= beta)
                    break;
            }
        }

        return maxVal;
    },

    monteCarlo: function (board, outCandidate) {
        var i, j;

        // 動かせる手を全部列挙
        var candidates = this.getProperCandidates(board);

        // 勝負数
        var point = new Array(candidates.length);
        for (i = 0; i < point.length; i++) {
            point[i] = 0;
        }

        // ランダムに指しまくって、プレイアウト時に一番勝てたやつにする
        for (i = 0; i < candidates.length; i++) {
            for (j = 0; j < 30; j++) {
                point[i] += this.playout(candidates[i].nextBoard, this.board.turn);
            }
        }

        var ret = [];
        var max = -1;
        for (i = 0; i < point.length; i++) {
            if (max < point[i]) {
                max = point[i];
            }
            if (max == point[i]) {
                ret.push(candidates[i]);
            }
        }

        return ret[MT.nextInt(0, ret.length)];
    },

    playout: function (board, turn) {
        var enemyTurn = PlayerTurn.invert(turn);
        if (board.isDeadLion(enemyTurn) || board.triesLion(turn))
            return 1;
        if (board.isDeadLion(turn) || board.triesLion(enemyTurn))
            return 0;

        // 動かせる手を全部列挙
        var candidates = this.getProperCandidates(board);
        return this.playout(candidates[MT.nextInt(0, candidates.length)].nextBoard, turn);
    }

};

var AIEngine_Random = function (board) {
    this.board = board;
    this.nodeNum = 0;
};
AIEngine_Random.prototype = new AIEngine(null);
AIEngine_Random.prototype.think = function () {
    // まともな手を全部列挙
    var candidates = this.getProperCandidates(this.board);
    // 適当に一つ選ぶ
    return candidates.getRandomItem();
};

var AIEngine_Simple = function (board) {
    this.board = board;
    this.nodeNum = 0;
};
AIEngine_Simple.prototype = new AIEngine(null);
AIEngine_Simple.prototype.think = function () {
    // 1手だけ読み、評価値がbestのものを返す
    var c = new AICandidate();
    this.negaMax(this.board, 1, c);
    return c;
};

var AIEngine_NegaMax = function (board) {
    this.board = board;
    this.nodeNum = 0;
};
AIEngine_NegaMax.prototype = new AIEngine(null);
AIEngine_NegaMax.prototype.think = function () {
    // 5手読む
    var c = new AICandidate();
    this.negaMax(this.board, 5, c);
    return c;
};

var AIEngine_NegaAlphaBeta = function (board) {
    this.board = board;
    this.nodeNum = 0;
};
AIEngine_NegaAlphaBeta.prototype = new AIEngine(null);
AIEngine_NegaAlphaBeta.prototype.think = function () {
    var c = new AICandidate();
    this.negaAlphaBeta(this.board, 5, -0xffff, 0xffff, c);
    return c;
};

var AIEngine_MonteCarlo = function (board) {
    this.board = board;
    this.nodeNum = 0;
};
AIEngine_MonteCarlo.prototype = new AIEngine(null);
AIEngine_MonteCarlo.prototype.think = function () {
    return this.monteCarlo(this.board);
};