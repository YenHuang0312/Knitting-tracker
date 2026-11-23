編織小日子 PWA｜部署與 iPhone 安裝說明
========================================

檔案內容
- index.html：App 主畫面
- styles.css：暖色系介面樣式
- app.js：作品、計時、計次、Gauge、歷史與備份功能
- manifest.webmanifest：PWA 設定
- sw.js：離線快取
- icons/：App 圖示

一、部署到 GitHub Pages（免費）
1. 登入 https://github.com/ 並建立一個新的 Public repository，例如 knitting-tracker。
2. 將本資料夾內所有檔案與 icons 資料夾上傳到 repository 根目錄。
   注意：不要只上傳 ZIP；要先解壓縮，再上傳裡面的檔案。
3. 在 repository 的 Settings → Pages。
4. 在 Build and deployment 選擇 Deploy from a branch。
5. Branch 選 main，資料夾選 /(root)，按 Save。
6. 等待部署完成，網址通常會是：
   https://你的GitHub帳號.github.io/knitting-tracker/
7. 用 iPhone 的 Safari 開啟該網址。

二、加入 iPhone 主畫面
1. 使用 Safari 開啟部署完成的網址（不要用 LINE 或其他 App 的內建瀏覽器）。
2. 點選 Safari 的「分享」圖示（方框向上箭頭）。
3. 向下滑，選擇「加入主畫面」。
4. 名稱可保留「編織小日子」，按「加入」。
5. 回到 iPhone 主畫面，點選新圖示即可像 App 一樣開啟。

三、功能使用
- 我的作品：新增多件作品，填入類型、棒針尺寸、毛線、顏色及備註。
- 編織中：選擇目前作品，開始／暫停計時；每織一行按 +1。
- 部位行數：可分別記錄前片、後片、左右袖等目前部位的行數。
- Gauge：在作品卡片按 Gauge，輸入 10 公分針數、行數、棒針尺寸及織法。
- 儲存本次編織紀錄：將目前部位、行數及計時存入歷史紀錄，並將本次計數與計時歸零。
- 資料備份：右上角齒輪 → 下載完整備份（JSON）。
- 匯入備份：右上角齒輪 → 匯入備份（JSON）。
- 匯出 CSV：匯出歷史紀錄，可用 Excel 開啟。

四、重要資料提醒
- 所有資料使用瀏覽器 localStorage，留在目前這台裝置／目前網站來源，不會自動同步到 iCloud 或其他裝置。
- 請定期下載 JSON 備份，並將備份檔存到「檔案」App 或 iCloud Drive。
- 清除 Safari 網站資料、刪除網站資料或更換裝置，可能導致資料遺失；請先備份。
- PWA 離線快取需先成功連線開啟一次。之後可在已快取的範圍內離線開啟。
- iOS 的背景執行有系統限制；若 App 在背景或手機鎖定時，畫面不會持續更新，但再次開啟時會依實際經過時間補算計時。
- 此版本不包含推播通知、iCloud 同步或 App Store 上架。
