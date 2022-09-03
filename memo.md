* 選択したセルにスクロールするようにする
* コマンド/Undo/Redo化をする(reducer?)
* DataSetをModelとViewModelに分ける
* DataSetに型を持たせる

* DataSetの型
  * JSON準拠 => number(int, float), string, bool, null
  * JSON準拠(合成) => array, object
  * SYAKUSON => array, objectと同等
  * ID(外部キー)
    * 対象のテーブル名.カラム名 で指定される
    * stringに埋め込む場合、内部的には#{ffffffff}のような文字列、表示上は"[スライム]"のようになる
  * すべては文字列に変換可能？（フォールバック）

* キーボード
  - 上下左右 => 選択 
    * (+Shift) =>範囲選択
    * (+Ctrl)=>一気に移動
    * (+Shift+Ctrl)=> 一気に選択
  * F2 => 編集開始
    * (+Shift) => コメントを追加
  * Enter => 下へ移動（タブを始めたところから） 
    * (+Ctrl) => 上へ移動 
    * (+Shift)=>なし
  * Tab => 右へ移動
    * (+Shift) => 左へ移動
* マウス
  * ?+Shift => 範囲選択（選択開始地点から)
  * ?+Ctrl => 選択範囲の追加
  - クリック => 選択
  * ドラッグ => 範囲選択
  * ヘッダをクリック => 列を選択
  * 行ヘッダをクリック => 行を選択
  * ヘッダ/フッタ境界をドラッグ => 幅/高さの変更
  * ヘッダ/フッタ境界をダブルクリック => 幅/高さを自動調整
  * Ctrl/Shift+ヘッダ/フッタ境界をクリック/ドラッグ => Excelが止まった！？
