
"use strict";

// ----------------------------------------------------------------------------------------------
// Mersenne Twister
// ----------------------------------------------------------------------------------------------
var MT = new MersenneTwister();


// ----------------------------------------------------------------------------------------------
// PlayerTurn
// ----------------------------------------------------------------------------------------------
var PlayerTurn = {
    man: 0,
    com: 1
};
PlayerTurn.invert = function (value) {
    return (value + 1) & 1;
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

Piece.movablePosDiff = new Array;
Piece.movablePosDiff[Piece.empty] = new Array;
(function () {
    var m = Piece.movement;
    var types = [Piece.hiyoko, Piece.niwatori, Piece.kirin, Piece.zo, Piece.lion];
    for (var i = 0; i < types.length; i++) {
        var man = types[i] + 8;
        var com = types[i] + 16;
        Piece.movablePosDiff[man] = new Array;
        Piece.movablePosDiff[com] = new Array;
        for (var r = 0; r <= 2; r++) {
            for (var c = 0; c <= 2; c++) {
                var idx = r * 3 + c;
                if (m[man][idx])
                    Piece.movablePosDiff[man].push(((r - 1) << 2) + (c - 1));
                if (m[com][idx])
                    Piece.movablePosDiff[com].push(((r - 1) << 2) + (c - 1));
            }
        }
    }
})();


Piece.create = function (type, turn) {
    return type + ((turn + 1) << 3);
};
Piece.type = function (piece) {
    return piece & 7;
};
Piece.turn = function (piece) {
    return piece < 16 ? 0 : 1;
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
    return (piece & 8) != 0;
};
Piece.isCom = function (piece) {
    return (piece & 16) != 0;
};
Piece.isSelf = function (piece, turn) {
    if (turn == 0)
        return piece < 16;
    else
        return piece >= 16;
};
Piece.isEnemy = function (piece, turn) {
    if (turn == 0)
        return piece >= 16;
    else
        return piece < 16;
};
Piece.convert = function (piece) {
    if (Piece.isMan(piece))
        return piece + 8;
    else
        return piece - 8;
};
Piece.promote = function (piece) {
    if ((piece & 7) == 1) // hiyoko
        return piece + 1; // niwatori
    return piece;
};
Piece.demote = function (piece) {
    if ((piece & 7) == 2) // niwatori
        return piece - 1; // hiyoko
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
Piece.evaluateTable = new Array;
(function () {
    var e = Piece.evaluateTable;
    e[Piece.empty] = 0;
    e[Piece.hiyoko0] = e[Piece.hiyoko1] = 2;
    e[Piece.niwatori0] = e[Piece.niwatori1] = 4;
    e[Piece.kirin0] = e[Piece.kirin1] = 7;
    e[Piece.zo0] = e[Piece.zo1] = 7;
    e[Piece.lion0] = e[Piece.lion1] = 100;
})();

Piece.tryBonus = new Array;
Piece.tryBonus[0] = [50, 5, -2, 0];
Piece.tryBonus[1] = (Piece.tryBonus[0]).concat().reverse();

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
BoardPosition.fromIndex = function (idx) {
    var row = idx >> 2;
    var col = idx & 3;
    return new BoardPosition(row, col);
};

BoardPosition.prototype = {
    equals: function (obj) {
        return this.row == obj.row && this.col == obj.col;
    },
    isPromotable: function (turn) {
        switch (turn) {
            case 0: return this.row == 0;
            case 1: return this.row == 3;
        }
    },    
    toIndex: function () {
        return (this.row << 2) + this.col;
    },
    toString: function () {
        return "(" + this.row + ", " + this.col + ")";
    }
};

BoardPosition.obj = new Array(4 * 3);
(function () {
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 3; c++) {
            BoardPosition.obj[(r << 2) + c] = new BoardPosition(r, c);
        }
    }
})();



// ----------------------------------------------------------------------------------------------
// Board
// ----------------------------------------------------------------------------------------------
var Board = function (data, lionPos, hand, turn, sphere) {
    this.data = data;
    this.lionPos = lionPos;
    this.hand = hand;
    this.turn = turn;
    this.sphere = sphere;
};
Board.createDefaultBoard = function () {
    var data = [
        Piece.kirin1, Piece.lion1, Piece.zo1, void 0,
        Piece.empty, Piece.hiyoko1, Piece.empty, void 0,
        Piece.empty, Piece.hiyoko0, Piece.empty, void 0,
        Piece.zo0, Piece.lion0, Piece.kirin0, void 0
    ];
    var lionPos = [(3 << 2) + 1, (0 << 2) + 1];
    var hand = [[], []];
    var turn = PlayerTurn.man;
    var board = new Board(data, lionPos, hand, turn, null);
    board.refreshSpheres();
    return board;
};


Board.prototype = {
    get: function (pos) {
        if(typeof pos == "number")
            return this.data[pos];
        else
            return this.data[(pos.row << 2) + pos.col];  
    },
    set: function (pos, value) {
        if(typeof pos == "number")
            return this.data[pos] = value;
        else
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
        var lionPos = this.lionPos.slice(0);
        var hand0 = this.hand[0].slice(0);
        var hand1 = this.hand[1].slice(0);
        var turn = this.turn;
        var sphere0 = this.sphere[0].slice(0, 16);
        var sphere1 = this.sphere[1].slice(0, 16);
        return new Board(data, lionPos, [hand0, hand1], turn, [sphere0, sphere1]);
    },

    move: function (beforePosVal, afterPosVal, turn) {

        var data = this.data;
        var movingPiece = data[beforePosVal];  // 移動する駒
        var currentPiece = data[afterPosVal]; // 今ある駒
        var sp, mpd;
        var i;

        // 自分のライオン位置更新
        if ((movingPiece & 7) == Piece.lion) {
            this.lionPos[turn] = afterPosVal;
        }
        // 敵の駒を取っている
        if (currentPiece != 0) {
            // 取られた敵の勢力圏変更
            sp = this.sphere[(turn + 1) & 1];
            mpd = Piece.movablePosDiff[currentPiece];
            for (i = mpd.length - 1; i >= 0; i--) {
                sp[afterPosVal + mpd[i]]--;
            }
            // ライオンを取った場合は変な位置にしとく
            if ((currentPiece & 7) == Piece.lion) {
                this.lionPos[(turn + 1) & 1] = -1;
            }
            // 取られる駒の成りを戻す
            if((currentPiece & 7) == 2) {
                currentPiece--;
            }
            // さらに味方にconvertして、手駒追加
            currentPiece = Piece.convert(currentPiece);
            this.hand[turn].push(currentPiece);
        }

        // 移動前の場所から勢力圏を消す
        sp = this.sphere[turn];
        mpd = Piece.movablePosDiff[movingPiece];
        for (i = mpd.length - 1; i >= 0; i--) {
            sp[beforePosVal + mpd[i]]--;
        }
        // 成る
        if((movingPiece & 7) == 1){ // hiyoko
            var isPromotable = (turn == 0) ? ((afterPosVal >> 2) == 0) : ((afterPosVal >> 2) == 3);
            if (isPromotable) {
                movingPiece++; // niwatori
            }
        }
        // 新しい勢力圏を設定
        mpd = Piece.movablePosDiff[movingPiece];
        for (i = mpd.length - 1; i >= 0; i--) {
            sp[afterPosVal + mpd[i]]++;
        }

        // 移動
        data[afterPosVal] = movingPiece;
        data[beforePosVal] = 0;

        // 取ったpieceを返す
        return currentPiece;
    },
    place: function (posVal, piece, turn) {
        this.data[posVal] = piece;
        this.hand[turn].removeOne(piece);
        // 影響度を加算
        var sp = this.sphere[turn];
        var mpd = Piece.movablePosDiff[piece];
        for (var i = mpd.length - 1; i >= 0; i--) {
            sp[posVal + mpd[i]]++;
        }
    },

    toggleTurn: function () {
        this.turn = (this.turn + 1) & 1;
        return this;
    },

    eachPiece: function (func) {
        var piece;
        var data = this.data;
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                piece = data[(r << 2) + c];
                if (piece != Piece.empty) {
                    func(piece, r, c);
                }
            }
        }
    },

    getPiecePositions: function (turn) {
        var result = new Array;
        var data = this.data;
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                var posVal = (r << 2) + c;
                var piece = data[posVal];
                var isSelf = (turn == 0) ? piece < 16 : piece >= 16;
                if (isSelf) {
                    result[result.length] = posVal;
                }
            }
        }
        return result;
    },

    getMovablePositions: function (posVal, turn) {
        var result = [];
        var data = this.data;
        var piece = data[posVal];
        var isEnemy = Piece.isEnemy;

        var movablePosDiff = Piece.movablePosDiff[piece];
        for (var i = movablePosDiff.length - 1; i >= 0; i--) {
            var newPosVal = posVal + movablePosDiff[i];
            var aroundCell = data[newPosVal];
            if (aroundCell == null)
                continue;
            if (aroundCell == 0 || isEnemy(aroundCell, turn)) {
                result[result.length] = newPosVal;
            }
        }

        return result;
    },

    getPlaceablePositions: function () {
        var result = [];
        var data = this.data;
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                var pos = (r << 2) + c;
                if (data[pos] == 0) {
                    result.push(pos);
                }
            }
        }
        return result;
    },

    isChecked: function (turn) {
        var lionPos = this.lionPos[turn];
        var enemyTurn = (turn + 1) & 1;
        var enemySphere = this.sphere[enemyTurn];
        return (enemySphere[lionPos] > 0);
    },

    isSelfPiece: function (pos) {
        var piece = this.data[(pos.row << 2) + pos.col];
        return Piece.isSelf(piece, this.turn);
    },

    isDeadLion: function (turn) {
        var lionPos = this.lionPos[turn];
        return (lionPos < 0);
    },
    triesLion: function (turn) {
        var lionPos = this.lionPos[turn];
        var r = (turn == 0) ? 0 : 3;
        return (lionPos >= 0) && ((lionPos >> 2) == r);
    },

    evaluate: function () {
        var ret = 0;
        var data = this.data;
        var sp = this.sphere;
        var sp0 = sp[0];
        var sp1 = sp[1];
        var evaluateTable = Piece.evaluateTable;

        // 盤上の駒の価値
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                var pos = (r << 2) + c;
                var piece = data[pos];
                if (piece > 0) {
                    var type = piece & 7;
                    var pieceTurn = (piece < 16) ? 0 : 1;
                    var enemyTurn = (pieceTurn + 1) & 1;
                    var value = evaluateTable[piece];

                    switch (type) {
                        case 5: // lion
                            // トライ加点
                            value += Piece.tryBonus[pieceTurn][r];
                            break;
                    }

                    // 駒の効き具合を加算
                    var es = sp[enemyTurn][pos];
                    var ps = sp[pieceTurn][pos];
                    value = value + ps - es;

                    if (pieceTurn == 1) {
                        value *= -1;
                    }
                    ret += value;
                }
                ret = ret + sp0[pos] - sp1[pos];
            }
        }
        // 手駒の価値
        var hand = this.hand;
        var i;
        for (i = 0; i < hand[0].length; i++) {
            ret += evaluateTable[hand[0][i]];
        }
        for (i = 0; i < hand[1].length; i++) {
            ret -= evaluateTable[hand[1][i]];
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
    },

    sphereString: function () {
        var sp0 = this.sphere[0];
        var sp1 = this.sphere[1];
        var val;

        var str = " Man  |  Com \n";
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 3; c++) {
                val = sp0[(r << 2) + c];
                str += (val > 0) ? "■" : "□";
            }
            str += "｜";
            for (var c = 0; c < 3; c++) {
                val = sp1[(r << 2) + c];
                str += (val > 0) ? "■" : "□";
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
// Action
// ----------------------------------------------------------------------------------------------
var ActionType = {
    empty: 0, move: 1, place: 2
};
var Action = function (type, content, board, nextBoard) {
    this.type = type;
    this.content = content;
    this.board = board;
    this.nextBoard = nextBoard;
};
Action.create = function (type, content, currentBoard, turn) {
    var nextBoard = currentBoard.clone();
    nextBoard.turn = (nextBoard.turn + 1) & 1;
    switch (type) {
        case ActionType.move:
            nextBoard.move(content.fromPos, content.toPos, turn);
            break;
        case ActionType.place:
            nextBoard.place(content.pos, content.piece, turn);
            break;
    }
    return new Action(type, content, currentBoard, nextBoard);
};
Action.prototype = {
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
                var posVal = (r << 2) + c;
                var piece = data[posVal];
                var isSelf = (turn == 0) ? (piece < 16) : (piece >= 16);
                if (isSelf) {
                    var movablePosDiff = Piece.movablePosDiff[piece];
                    for (var i = movablePosDiff.length - 1; i >= 0; i--) {
                        var newPosVal = posVal + movablePosDiff[i];
                        var aroundCell = data[newPosVal];
                        if (aroundCell == null)
                            continue;
                        // 何も無いマスか、または敵がいるときは、動ける
                        if (aroundCell == 0 || 
                            ((turn == 0) ? aroundCell >= 16 : aroundCell < 16)) {
                            ret[ret.length] = new Move(posVal, newPosVal);
                        }
                    }
                }
            }
        }

        return ret;
    },
    getMoveCandidates: function (board) {
        var candidates = [];
        var moves = this.getMoves(board, board.turn);
        for (var i = moves.length - 1; i >= 0; i--) {
            var c = Action.create(ActionType.move, moves[i], board, board.turn);
            candidates.push(c);
        }
        return candidates;
    },
    getPlaces: function (board, turn) {
        var ret = [];
        var hand = board.hand;
        var placeablePositions = board.getPlaceablePositions();
        for (var i = placeablePositions.length - 1; i >= 0; i--) {
            // 置ける手を全部列挙
            var myhand = hand[turn];
            for (var j = myhand.length - 1; j >= 0; j--) {
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
            var c = Action.create(ActionType.place, places[i], board, board.turn);
            candidates.push(c);
        }
        return candidates;
    },

    findCatchingLionMove: function (candidates, turn) {
        var data = this.board.data;
        var enemyLion = Piece.create(Piece.lion, ((turn + 1) & 1));
        for (var i = candidates.length - 1; i >= 0; i--) {
            var piece = data[candidates[i].content.toPos];
            if (piece == enemyLion) {
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
        var enemyTurn = PlayerTurn.invert(myTurn);
        for (var i = candidates.length - 1; candidates.length > 1 && i >= 0; i--) {
            // 敵の勢力圏に自ライオンが入ってたらアウト
            var nextBoard = candidates[i].nextBoard;
            var sphere = nextBoard.sphere[enemyTurn];
            var lionPos = nextBoard.lionPos[myTurn];
            if (sphere[lionPos] > 0) {
                candidates.splice(i, 1);
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

        // 自分から死にに行く手は消す
        this.filterSuicide(candidates);

        // 王手がかっていないなら、駒を置く手も考える
        if (!board.isChecked(board.turn)) {
            // 置ける手を全部列挙し追加
            (new Array).push.apply(candidates, this.getPlaceCandidates(board));
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
        var maxCandidates = new Array;

        for (var i = candidates.length - 1; i >= 0; i--) {
            // 次の局面について、maxでさらに先読み
            var e = -this.negaMax(candidates[i].nextBoard, depth - 1, null);
            if (maxVal < e) {
                maxVal = e;
                maxCandidates.length = 0;
            }
            if (maxVal == e) {
                maxCandidates.push(candidates[i]);
            }
        }
        if (outCandidate) {
            outCandidate.replace(maxCandidates.getRandomItem());
        }
        return maxVal;
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
    var c = new Action();
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
    var c = new Action();
    this.negaMax(this.board, 5, c);
    return c;
};


var AIEngine_NegaAlphaBeta = function (board) {
    this.board = board;
    this.nodeNum = 0;
};
AIEngine_NegaAlphaBeta.prototype = new AIEngine(null);
AIEngine_NegaAlphaBeta.prototype.think = function () {
    var c = new Action();
    this.negaAlphaBeta(this.board, 5, -0xffff, 0xffff, c);
    return c;
};
AIEngine_NegaAlphaBeta.prototype.negaAlphaBeta = function (board, depth, alpha, beta, outCandidate) {
    // 最大深さに達していれば再帰終わり
    if (depth <= 0) {
        return (board.turn == 0) ? board.evaluate() : -board.evaluate();
    }
    this.nodeNum++;

    // 動かせる手を全部列挙
    var candidates = this.getProperCandidates(board);

    // 最大の評価点のものを選ぶ
    var maxVal = -0xffff;
    var maxIndex = 0;
    for (var i = candidates.length - 1; i >= 0; i--) {
        // 次の局面について先読み
        var e = -this.negaAlphaBeta(candidates[i].nextBoard, depth - 1, -beta, -alpha, null);
        if (maxVal < e) {
            maxVal = e;
            maxIndex = i;
            if (alpha < e) {
                alpha = e;
            }
            if (e >= beta)
                break;
        }
    }
    if (outCandidate) {
        outCandidate.replace(candidates[maxIndex]);
    }
    return maxVal;
};

var AIEngine_MonteCarlo = function (board) {
    this.board = board;
    this.nodeNum = 0;
};
AIEngine_MonteCarlo.prototype = new AIEngine(null);
AIEngine_MonteCarlo.prototype.think = function () {
    return this.monteCarlo(this.board);
};
AIEngine_MonteCarlo.prototype.monteCarlo = function (board, outCandidate) {
    var i, j;

    // 動かせる手を全部列挙
    var candidates = this.getProperCandidates(board);

    // 勝ち負け数
    var point = new Array(candidates.length);
    for (i = point.length - 1; i >= 0; i--) {
        point[i] = 0;
    }

    // ランダムに指しまくって、プレイアウト時に一番勝てたやつにする
    for (i = candidates.length - 1; i >= 0; i--) {
        for (j = 0; j < 20; j++) {
            point[i] += this.playout(candidates[i].nextBoard, this.board.turn, 100);
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
};

AIEngine_MonteCarlo.prototype.playout= function (board, turn, depth) {
    if (depth-- <= 0)
        return 0;
    var enemyTurn = (turn + 1) & 1;
    if (board.isDeadLion(enemyTurn) || board.triesLion(turn))
        return 1;
    if (board.isDeadLion(turn) || board.triesLion(enemyTurn))
        return 0;

    // 動かせる手を全部列挙
    var candidates = this.getProperCandidates(board);
    return this.playout(candidates[MT.nextInt(0, candidates.length)].nextBoard, turn, depth);
};