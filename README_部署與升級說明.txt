編織小日子 v2.0｜GitHub Pages 部署與升級說明
=================================================

本版本包含：
- 棒針毛衣織圖計算草稿：Gauge、身體尺寸、肩型、領型、織作方向、版型、Ease、袖型、衣長、袖長等。
- 鉤針織圖編輯器：作品、部位、圈織／織片、逐圈針法與基本針數計算。
- 作品管理、計時器、計次、歷史紀錄。
- JSON 完整備份／匯入、CSV 歷史匯出。
- PWA manifest、Service Worker 離線快取、iPhone 主畫面圖示。

重要：資料相容與升級
--------------------
v2 會沿用第一版 ZIP 的 localStorage key「knitting_little_days_v1」，並嘗試讀取早期測試版 key「knit_tracker_v1」。
請在部署新版前，先於舊版 App 的齒輪選單下載 JSON 備份。
如果新舊版部署網址（origin）不同，瀏覽器 localStorage 不會自動跨網址搬移。此時請在舊版匯出 JSON，再在新版網址的齒輪選單匯入。
若舊版曾使用不同網址或 Safari 網站資料已清除，請以手上的 JSON 備份還原。

部署 GitHub Pages
-----------------
1. 解壓縮此 ZIP。
2. 到 GitHub 建立或開啟 Public repository，例如 knitting-tracker。
3. 將 ZIP 內的所有內容上傳到 repository 根目錄；必須看到 index.html、app.js、styles.css、manifest.webmanifest、sw.js 與 icons 資料夾。
4. Repository → Settings → Pages。
5. Build and deployment：Deploy from a branch。
6. Branch 選 main，資料夾選 /(root)，按 Save。
7. 等待 Actions / Pages 部署完成。網址格式：
   https://你的GitHub帳號.github.io/knitting-tracker/
8. 用 iPhone Safari 開啟網址。

iPhone 加入主畫面
-----------------
1. Safari 開啟 GitHub Pages 網址（不要用 LINE 等 App 內建瀏覽器）。
2. 點分享圖示。
3. 選「加入主畫面」。
4. 名稱使用「編織小日子」，按「加入」。

功能使用
--------
棒針：
- 棒針織圖頁面輸入 10cm Gauge、實際胸圍、身體尺寸、毛衣結構、領型、織作方向、版型與 Ease。
- 按「產生毛衣織圖計算草稿」。
- 可編輯文字織圖、複製或儲存為作品。
- 身高體重僅作參考；胸圍等實際量測更重要。
- 正肩袖山、肩斜、V 領曲線、領口挑針與袖窿配合仍需人工核對及試織。這不是自動保證合身的專業版型 CAD。

鉤針：
- 輸入作品名稱，新增頭部、耳朵、身體等部位。
- 選圈織或來回織片。
- 輸入例如 (sc*3, inc*1)*6。
- 基本計算支援 sc、hdc、dc、tr、slst、inc、dec 及括號重複。
- 不規則特殊針法、跨針、跳針、泡泡針、同一針目多次操作等，請自行核對計算並填寫預期針數。

資料保存
--------
- 資料保存在目前網站來源的瀏覽器 localStorage，不會自動同步到 iCloud 或其他裝置。
- 請定期下載 JSON 備份。
- 清除 Safari 網站資料、換手機或改變網站來源可能導致資料無法直接讀取。
- iOS 會限制背景執行；計時以開始／暫停時間戳補算，返回 App 時更新顯示。

建議測試
--------
- 先匯入第一版備份。
- 新增測試作品並開始、暫停、儲存計時紀錄。
- 用 (sc*3, inc*1)*6 測試鉤針計算，應得 30 針。
- 用測試 Gauge 24 針／32 行與胸圍 84 cm 測試棒針計算草稿。
- 下載 JSON 備份，再重新匯入測試。


【v2.3 更新內容】
1. 首頁行數統計依作品分開顯示。
2. 計時器可輸入起始時數與分鐘數，例如 2 小時 30 分。
3. 首頁累積時間依作品分開顯示；包含已儲存歷史紀錄及目前計時器時間。
4. 作品管理卡片顯示每件作品的總行數／圈數及累積時間，數據由該作品歷史紀錄連動計算。
5. 計次部位保留常用下拉選單，並支援自行輸入部位名稱。
6. 歷史紀錄以作品 ID 關聯；舊資料若沒有作品 ID，會嘗試以作品名稱對應。
更新前請先從設定匯出 JSON 備份，再將新版所有檔案覆蓋上傳至原 GitHub Pages Repository。
