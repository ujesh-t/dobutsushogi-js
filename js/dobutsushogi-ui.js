
"use strict";  

// For IE6,7
if (!('console' in window)) {
    window.console = {};
    window.console.log = function (str) {
        return str;
    };
}

function p() {
    /// <summary>
    /// デバッグ用出力
    /// </summary>
    for (var i = 0; i < arguments.length; i++) {
        console.log(arguments[i]);
    }
}
function pp() {
    /// <summary>
    /// デバッグ用出力 (画面にも出す)
    /// </summary>
    for (var i = 0; i < arguments.length; i++) {
        var a = arguments[i];
        var date = new Date();
        var unixTime = date.getTime();
        var str = (typeof a === "undefined") ? "undefined" : (a == null) ? "null" : a.toString();
        var opt = $("<option></option>").attr({ value: unixTime })
                .text($.format("{0}", str));
        $("#debug-logs").prepend(opt);
        $("#debug-logs").val(unixTime);
        console.log(a);
    }
}

// Arguments are image paths relative to the current page.
$.preLoadImages = function () {
    for (var i = arguments.length; i--; ) {
        $('img').attr("src", arguments[i]);
    }
}



var Player = function (view, afterClickCallback) {
    /// <summary>
    /// プレイヤーabstract
    /// </summary>
    this.view = view;
    this.afterClickCallback = afterClickCallback;
};
Player.prototype = {
    act: function () {
    },
    onClickCell: function () {
    }
};

var ManPlayer = function (view, afterClickCallback) {
    /// <summary>
    /// 人間プレイヤー
    /// </summary>
    this.view = view;
    this.afterClickCallback = afterClickCallback;
};
ManPlayer.prototype = new Player(null, null);
ManPlayer.prototype.act = function () {
    // manはclickイベント駆動のため、こでは何もできない。
    // onclickからafterClickCallbackで次の段階へいく。
};
ManPlayer.prototype.onClickCell = function (event, elem) {
    var pos = BoardPosition.fromCoordinate(elem.position());
    var view = this.view;
    // 自分の駒を選択時（動かす）
    if (view.isSelectingManPiece(elem, pos)) {
        view.selectManPiece(pos);
    }
    // 置く先が出てるとき
    else if (view.isReadyToPlace(pos)) {
        var candidate = view.beginPlacing(pos);
        this.afterClickCallback(candidate);
    }
    // 移動先が出てるとき
    else if (view.isReadyToMove(pos)) {
        var candidate = view.beginMoving(pos);
        this.afterClickCallback(candidate);
    }
};

var ComPlayer = function (view, afterClickCallback, aiName) {
    /// <summary>
    /// COMプレイヤー
    /// </summary>
    this.view = view;
    this.afterClickCallback = afterClickCallback;
    this.aiName = aiName;
};
ComPlayer.prototype = new Player(null, null);
ComPlayer.prototype.act = function () {

    var board = this.view.getBoard();
    var ai;
    switch (this.aiName) {
        case "random":
            ai = new AIEngine_Random(board, PlayerTurn.com); break;
        case "1":
            ai = new AIEngine_Simple(board, PlayerTurn.com); break;
        case "negamax":
            ai = new AIEngine_NegaMax(board, PlayerTurn.com); break;
        case "negaab":
            ai = new AIEngine_NegaAlphaBeta(board, PlayerTurn.com); break;
        case "montecarlo":
            ai = new AIEngine_MonteCarlo(board, PlayerTurn.com); break;
    }

    var candidate = ai.think();
    pp("先読み: " + ai.nodeNum + "局面");
    this.afterClickCallback(candidate);

    //p(board.inspect());
};
ComPlayer.prototype.onClickCell = function (event, elem) {
    // comはすべてAIで駆動。セルのクリックでは何もしない。
};
ComPlayer.prototype.getAIName = function () {
    return this.aiName;
};
//ComPlayer.prototype.setAIName = function (value) {
 //   this.aiName = value;
//};



var PlacingPiece = function (index, value) {
    /// <summary>
    /// 置こうとしている駒情報の構造体
    /// </summary>
    this.index = index; // 手駒のインデックス (0~5)
    this.value = value; // 手駒の値(Piece)
}



function View() {
/// <summary>
/// どうぶつしょうぎUI制御
/// </summary>

    var _board;
    var _handPieces;
    var _players;
    var _beforePos;
    var _movablePositions;
    var _placeablePositions;    
    var _uiDisabled;
    var _placingPiece;
    var _self = this;

    // -------------------------- public --------------------------------

    this.initialize = function () {
        /// <summary>
        /// 初期化
        /// </summary>
        this.initializeParams();
        this.showPieces();
        // _registerClickEventsは呼ばない。1度だけしか呼んじゃダメなので明示的に。
    }
    this.initializeParams = function () {
        /// <summary>
        /// 変数初期化
        /// </summary>
        _board = Board.createDefaultBoard();
        //_board = Board.createTestBoard2();
        _handPieces = [new Array(6), new Array(6)];
        _players = [new ManPlayer(this, _updateBoard), new ComPlayer(this, _updateBoard, null)];
        _beforePos = null;
        _movablePositions = [];
        _placeablePositions = [];
        _placingPiece = null;
        _uiDisabled = false;
    }
    this.showPieces = function () {
        /// <summary>
        /// _board変数の内容に従い駒を配置
        /// </summary>
        $('#board > div.piece').remove();
        $('#board > div.piece-hand').remove();
        _board.eachPiece(function (piece, row, col) {
            var div = _createPiece(piece, row, col);
            $('#board').append(div);
        });
    };
    this.registerClickEvents = function () {
        /// <summary>
        /// イベントハンドラの設定
        /// </summary>        
        _registerClickEvents();
    };
    this.showSettingDialog = function () {
        /// <summary>
        /// 対局設定ダイアログを出す
        /// </summary>    
        var options = {
            title: "対局設定",
            buttons: {
                "対局": function (event) {
                    _board.turn = parseInt($("input[name=radio-order]").filter(":checked").val());
                    _players[1].aiName = $("input[name=radio-ai]").filter(":checked").val();
                    $(this).dialog("close");
                    // 一旦ターンを逆にしておいて、toggleTurnでゲーム起動
                    _board.toggleTurn();
                    var waitTime = (_board.turn == PlayerTurn.man) ? 333 : 0;
                    setTimeout(_toggleTurn, waitTime);
                }
            }
        };
        $("#dialog-selectable").dialog("option", options).dialog("open");
    };

    this.isSelectingManPiece = function (elem, pos) {
        return elem.hasClass("piece") && _board.isSelfPiece(pos);
    };
    this.selectManPiece = function (pos) {
        _clearMovablePositions();
        // 同じ場所クリックはキャンセル
        if (_beforePos != null && pos.equals(_beforePos)) {
            _initializePieceFlags();
            return;
        }
        
        // いける場所を表示
        _initializePieceFlags();
        _getCellAt(pos).addClass('cell-active');
        _movablePositions = _board.getMovablePositions(pos, _board.turn);
        _displayMovablePositions(_movablePositions);
        _beforePos = pos; 
    };
    this.isReadyToPlace = function (pos) {
        return (_placeablePositions.length > 0) && (_placeablePositions.myIndexOf(pos) >= 0);
    };
    this.beginPlacing = function (pos) {
        _uiDisabled = true;
        var place = new Place(pos, _placingPiece.value, _placingPiece.index);
        var candidate = new AICandidate(AICandidateType.place, place, _board, null);
        _clearMovablePositions();
        _initializePieceFlags();
        return candidate;
    };
    this.isReadyToMove = function (pos) {
        return (_movablePositions.length > 0) && (_movablePositions.myIndexOf(pos) >= 0);
    };
    this.beginMoving = function (pos) {
        _uiDisabled = true;
        var move = new Move(_beforePos, pos);
        var candidate = new AICandidate(AICandidateType.move, move, _board, null);
        _clearMovablePositions();
        _initializePieceFlags();
        return candidate;
    };

    this.error = function (msg) {
        alert(msg);
        _unregisterClickEvents();
    };
    this.getBoard = function () { return _board; }
    this.getHandPieces = function () { return _handPieces; }


    // -------------------------- private --------------------------------

    function _initializePieceFlags() {
        _beforePos = null;
        _movablePositions = [];
        _placeablePositions = [];
    }
    function _registerClickEvents() {
        /// <summary>
        /// イベントハンドラの設定
        /// </summary>        
        var clickEvent = _getClickEventName();
        $(document).on(clickEvent, "div.piece", function (event) {
            _onClickCell(event, $(this));
            event.preventDefault();
        });
        $("#board td.cell").on(clickEvent, function (event) {
            _onClickCell(event, $(this));
            event.preventDefault();
        });
        $(document).on(clickEvent, "div.piece-hand", function (event) {
            _onClickHand(event, $(this));
            event.preventDefault();
        });
    };
    function _unregisterClickEvents() {
        /// <summary>
        /// イベントハンドラの登録解除
        /// </summary>
        $("div.piece").off();
        $("td.cell").off();
        $("div.piece-hand").off();
        _uiDisabled = true;
    };

    function _getClickEventName() {
        /// <summary>
        /// デバイスに応じたtapイベント名を返す。
        /// </summary>
        var userAgent = navigator.userAgent.toLowerCase();
        var isMobileApple = ((userAgent.indexOf('iphone') >= 0 || userAgent.indexOf('ipad') >= 0) &&
                                userAgent.indexOf('ipod') < 0);
        //var isMobileOpera = (userAgent.indexOf('opera movi') >= 0);
        var isAndroid = (userAgent.indexOf('android') >= 0);
        var isWindowPhone = (userAgent.indexOf('windows phone') >= 0);
        return (isMobileApple || isAndroid || isWindowPhone) ? 'touchend' : 'click';
    }

    function _onClickCell(event, elem) {
        /// <summary>
        /// cellまたはpiece要素をtapしたときの処理
        /// </summary>
        if (_uiDisabled)
            return;

        _players[_board.turn].onClickCell(event, elem);
    }

    function _onClickHand(event, elem) {
        /// <summary>
        /// 手駒(piece-hand)要素をtapしたときの処理
        /// </summary>
        if (_uiDisabled)
            return;

        _initializePieceFlags();
        _clearMovablePositions();

        var m = elem.attr("id").match(/piece-hand(\d)_(\d)/);
        var turn = parseInt(m[1]);
        var index = parseInt(m[2]);
        if (_placingPiece != null && _placingPiece.index == index) {
            _placingPiece = null;
            return;
        }
        _placingPiece = new PlacingPiece(index, _handPieces[turn][index]);
        _placeablePositions = _board.getPlaceablePositions(_placingPiece.value);
        _displayPlaceablePositions();
        _getHandCellAt(turn, index).addClass('cell-active');
    }

    function _toggleTurn() {
        /// <summary>
        /// 手番を入れ替え
        /// </summary>     
        _board.toggleTurn();
        // 勝敗チェック
        if (_board.isDeadLion(_board.turn)) {
            _endGame(_board.turn != PlayerTurn.man);
        }
        else if (_board.triesLion(_board.turn)) {
            _endGame(_board.turn == PlayerTurn.man);
        }
        // 続行
        else {
            _uiDisabled = (_board.turn == PlayerTurn.com);
            _players[_board.turn].act();
        }
    }

    function _endGame(wonMan) {
        /// <summary>
        /// ゲーム終了ダイアログ
        /// </summary>
        _uiDisabled = true;

        var options = {
            title: "あなたの" + ((wonMan) ? "勝ちです" : "負けです"),
            buttons: {
                "はい": function (event) {
                    _self.initialize();
                    _self.showSettingDialog();
                    $(this).dialog("close");
                },
                "いいえ": function (event) {
                    $(this).dialog("close");
                }
            }
        };
        $("#dialog-yesno").children("p").text("もう一回する？");
        $("#dialog-yesno").dialog("option", options).dialog("open");
    }

    function _updateBoard(candidate) {
        /// <summary>
        /// プレイヤーから指示が返ってきた後のコールバック処理
        /// </summary>
        var c = candidate.content
        switch (candidate.type) {
            case AICandidateType.move:                
                var pieceChange = _board.move(c.fromPos, c.toPos, _board.turn);
                if (pieceChange.got != Piece.empty) {
                    _movePieceToHand(c.toPos, pieceChange.got, _board.turn);
                }
                _movePieceOnBoard(c.fromPos, c.toPos, pieceChange);
                break;
            case AICandidateType.place:
                _board.place(c.pos, c.piece, _board.turn);
                var index = c.handIndex || _handPieces[_board.turn].indexOf(c.piece);
                _movePieceToBoard(index, c.pos);
                break;
            default:
                this.error("fatal error at _updateBoard");
                break;
        }
        pp("評価値: " + _board.evaluate());
    }

    function _createPiece(piece, row, col) {
        /// <summary>
        /// (row, col)の位置に駒を配置
        /// </summary>
        var top = row * 80;
        var left = col * 80;
        var img = $("<img />").attr({ "width": 80, "height": 80, "alt": Piece.name(piece), "src": Piece.imagePath(piece) });
        var div = $("<div></div>").attr({ "id": $.format("piece{0}_{1}", row, col) })
                        .addClass("piece").css({ "top": top, "left": left });
        return div.append(img);
    }

    function _getCellAt(pos) {
        /// <summary>
        /// 指定した(row, col)の位置のcell要素を返す
        /// </summary>
        return $("#cell" + pos.row + "_" + pos.col);
    }
    function _getHandCellAt(turn, index) {
        /// <summary>
        /// 指定した位置の手駒cell要素を返す
        /// </summary>
        return $("#cell-hand" + turn + "_" + index);
    }
    function _getPieceAt(pos) {
        /// <summary>
        /// 指定した(row, col)の位置のpiece要素を返す
        /// </summary>
        return $("#piece" + pos.row + "_" + pos.col);
    }
    function _getHandPieceAt(turn, index) {
        /// <summary>
        /// 指定した位置の手駒piece要素を返す
        /// </summary>
        return $("#piece-hand" + turn + "_" + index);
    }

    function _displayMovablePositions() {
        /// <summary>
        /// _movablePositionsに入っている座標をもとに、選択中の駒が進めるセルをハイライト
        /// </summary>
        for (var i = 0; i < _movablePositions.length; i++) {
            var pos = _movablePositions[i];
            _getCellAt(pos).addClass('cell-movable');
        }
    }
    function _displayPlaceablePositions() {
        /// <summary>
        /// _placeblePositionsに入っている座標をもとに、駒を置けるセルをハイライト
        /// </summary>
        for (var i = 0; i < _placeablePositions.length; i++) {
            var pos = _placeablePositions[i];
            _getCellAt(pos).addClass('cell-placeable');
        }
    }
    function _clearMovablePositions() {
        /// <summary>
        /// _displayMovablePositionsのハイライトを消す
        /// </summary>
        $("td.cell").removeClass('cell-movable').removeClass('cell-placeable').removeClass('cell-active');
        $("td.cell-hand").removeClass('cell-active');
    }
    function _movePieceOnBoard(fromPos, toPos, pieceChange) {
        /// <summary>
        /// 盤上のマス間の駒の移動
        /// </summary>
        _getPieceAt(fromPos).animate(
            { left: toPos.col * 80, top: toPos.row * 80 },
            {
                duration: 400,
                queue: false,
                complete: function () {
                    $(this).attr({ "id": $.format("piece{0}_{1}", toPos.row, toPos.col) });
                    $(this).children("img").attr({ "src": Piece.imagePath(pieceChange.moved) });
                    var waitTime = (_board.turn == PlayerTurn.man) ? 333 : 0;
                    setTimeout(_toggleTurn, waitTime);
                }
            });
    }
    function _movePieceToBoard(handIndex, newPos) {
        /// <summary>
        /// 手駒を盤面へ移動
        /// </summary>
        _unregisterHandPiece(handIndex);

        var pieceObj = _getHandPieceAt(_board.turn, handIndex);
        pieceObj.css({ "z-index": 100 });
        pieceObj.children("img").attr({ "width": 80, "height": 80 });

        pieceObj.animate(
            {
                "left": newPos.col * 80,
                "top": newPos.row * 80
            },
            {
                duration: 400,
                queue: false,
                easing: "swing",
                complete: function () {
                    $(this).css({ "z-index": 1 })
                            .attr({ "id": $.format("piece{0}_{1}", newPos.row, newPos.col) })
                            .removeClass("piece-hand").addClass("piece");
                    var waitTime = (_board.turn == PlayerTurn.man) ? 333 : 0;  // この時点で逆転済みなので条件も逆
                    setTimeout(_toggleTurn, waitTime);
                }
            });
    }

    function _movePieceToHand(pos, pieceVal) {
        /// <summary>
        /// 取った相手の駒を手駒へ移動
        /// </summary>
        var pieceObj = _getPieceAt(pos);

        pieceObj.css({ "z-index": 100 });
        pieceObj.children("img")
                    .attr({ "width": 60, "height": 60, "src": Piece.imagePath(pieceVal) });
        var handIndex = _registerHandPiece(pieceVal);
        pieceObj.animate(
                    {
                        "left": handIndex * 40 - 10,
                        "top": (_board.turn == PlayerTurn.man) ? 330 : -80
                    },
                    {
                        duration: 400,
                        queue: false,
                        easing: "swing",
                        complete: function () {
                            $(this).css({ "z-index": 1 })
                                    .attr({ "id": $.format("piece-hand{0}_{1}", _board.turn, handIndex) })
                                    .removeClass("piece").addClass("piece-hand");
                        }
                    }
                );
    }
    function _registerHandPiece(pieceVal) {
        /// <summary>
        /// 手駒に駒を追加する
        /// </summary>
        var myHand = _handPieces[_board.turn];
        for (var i = 0; i < myHand.length; i++) {
            if (myHand[i] == null) {
                myHand[i] = pieceVal;
                return i;
            }
        }
        this.error("Fatal error at '_registerHandPiece'");
    }
    function _unregisterHandPiece(index) {
        /// <summary>
        /// 手駒から駒を削除する
        /// </summary>
        _handPieces[_board.turn][index] = null;
    }
}



$(function () {
    Deferred.define();

    next(function () {
        return 1;
    }).next(function (a) {
        console.log(a);
    });

    $.preLoadImages('img/niwatori0.png', 'img/niwatori1.png');

    var view = new View();
    view.initialize();
    view.registerClickEvents();

    $("#setting-order").buttonset();
    $("#setting-ai").buttonset();
    $("#dialog-yesno").dialog({
        "autoOpen": false,
        "width": 240,
        "modal": true,
        "resizable": false,
        "position": "center",
        "draggable": false,
        "closeOnEscape": false
    });
    $("#dialog-selectable").dialog({
        "autoOpen": false,
        "width": 280,
        "height": 320,
        "modal": true,
        "resizable": false,
        "position": "center",
        "draggable": false,
        "closeOnEscape": false
    });

    view.showSettingDialog();

    //pp(navigator.userAgent);
});
