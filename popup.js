/**
 * Chrome Extension 撰寫教學: https://ithelp.ithome.com.tw/articles/10186039
 * 
 * chrome.tabGroups 官方文件: https://developer.chrome.com/docs/extensions/reference/tabGroups/#type-TabGroup
 * chrome.tabs 官方文件: https://developer.chrome.com/docs/extensions/reference/tabs/
 */
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// 從本地瀏覽器中讀取使用者輸入的資料
const getGroupArr = () => {
    return new Promise((resolve, reject) => {
        let tmpArr = [];
        chrome.storage.local.get(['myGroupArr'], (result) => {
            console.log(`自 Chrome local storage 讀取資料成功:`, result);
            if(result['myGroupArr']) {
                tmpArr = result['myGroupArr'];
            } else {
                tmpArr = [];
            }
            resolve(tmpArr);
        });
    });
}

// 取得 _min ~ _max 之間的亂數
const genRandomInt = (_min, _max) => {
    return Math.floor(Math.random() * _max) + _min;
}

// 存儲資料到 const & chrome
const doSaveData = (_keywords) => {

    if(groupArr.find(xx => xx.urlKeywords.toLowerCase() === _keywords.toLowerCase())){
        alert(`已有此關鍵字: ${_keywords}`);
        return;
    }

    let dataToSave = { name: _keywords, urlKeywords: _keywords, color: colorList[genRandomInt(0, colorList.length - 1)], tabIds: [] };

    // 儲存到 array
    groupArr.push(dataToSave);

    // 將使用者輸入的資料儲存到本地瀏覽器中
    chrome.storage.local.set({ 'myGroupArr': groupArr }, () => {
        console.log(`資料儲存至 Chrome local storage 成功`, groupArr);
        // 清空輸入框
        document.querySelector('#keywordsInp').value = '';
        document.querySelector('#keywordsInp').focus();
    });
}

// 重置邏輯
const doReset = (kw) => {
    if(kw) {
        groupArr = groupArr.filter(x => x.urlKeywords === kw)
    }

    groupArr.forEach(x => {
        // console.log('x.tabIds', x.tabIds);
        let tabIdsArr = x.tabIds;
        tabIdsArr.splice(0);
    });
    
    // 更新 groupArr，重新儲存到 chrome
    chrome.storage.local.set({ 'myGroupArr': groupArr }, () => {
        console.log(`[重置按鈕] 更新 groupArr，重新儲存到 chrome`, groupArr);
    });
}

// 根據 url 中的關鍵字，將之 group
const groupTabsByUrlKeywords = async (tabs) => {
    tabs.forEach((tab) => {
        for (let group of groupArr) {
            if (tab.url.includes(group.urlKeywords)) {
                group.tabIds.push(tab.id);

                // 將使用者輸入的資料儲存到本地瀏覽器中
                chrome.storage.local.set({ 'myGroupArr': groupArr }, () => {
                    console.log(`根據關鍵字找分頁，push tabIds 後，儲存至 Chrome local storage 成功`, groupArr);
                });
            }
        }
    });

    groupArr.forEach((group) => {
        if (group.tabIds.length > 0) {
            chrome.tabs.group({ tabIds: group.tabIds }, (groupId) => {
                chrome.tabGroups.update(groupId, {
                    title: group.name,
                    color: group.color,
                });
            });
        }
    });
};
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const colorList = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

// var groupArr = [
//     { name: 'Youtube', urlKeywords: 'youtube', color: 'pink', tabIds: [] },
//     { name: 'Instagram', urlKeywords: 'instagram', color: 'yellow', tabIds: [] }
// ];
var groupArr = []; // 預設空陣列

// IIFAE 寫法： Immediately Invoked Async Function Expression
~async function() {
    console.log(' ... IIFE - init ... ');
    groupArr = await getGroupArr();
    console.log('groupArr = ', groupArr);
}();

// 綁定「新增」按鈕事件 → 注意：keypress事件無法在 chrome extension 上作用
['click', 'keypress'].forEach(ee => {
    let elem = document.querySelector("#addBtn");
    switch (ee) {
        case 'click':
            elem.addEventListener(ee, (e) => {
                e.preventDefault();
                e.stopPropagation();
                let kwStr = document.querySelector('#keywordsInp').value;
                if(kwStr.length === 0 || /\s/.test(kwStr)){
                    alert("請輸入字串！")
                    return;
                }
                doSaveData(kwStr);
            });
            break;
        case 'keypress': // not working
            elem.addEventListener(ee, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.key === "Enter") {
                    let kwStr = document.querySelector('#keywordsInp').value;
                    if(kwStr.length === 0 || /\s/.test(kwStr)){
                        alert("請輸入字串！")
                        return;
                    }
                    doSaveData(kwStr);
                }
            });
            break;
    }
});

// 執行按鈕
document.querySelector('#execBtn').addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    doReset(); // 根據 keywords 清空對應的 tabIds 陣列

    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
        groupTabsByUrlKeywords(tabs);
    });
});

// 取消群組按鈕
document.querySelector('#cancelGroupBtn').addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    groupArr = await getGroupArr(); // 取得 groupArr
    groupArr.forEach(gp => {
        if (gp.tabIds.length > 0) {
            chrome.tabs.ungroup(gp.tabIds, () => {
                console.log('執行 ungroup');
            }); 
        }
    })
});

// 重置按鈕
// document.querySelector("#resetButton").addEventListener("click", (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if(confirm("確定重置嗎？") === false){
//         return;
//     }
//     doReset();
// });

// 查詢目前設定關鍵字
document.querySelector("#queryKeywords").addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector("#kwTable > tbody tr")?.remove();

    groupArr = await getGroupArr(); // 取得 groupArr

    let trString = groupArr.map((perData, idx) => {
        return `<tr>
                    <th scope="row">${idx + 1}</th>
                    <td>${perData.urlKeywords}</td>
                    <td><button type="button" class="btn btn-sm btn-outline-danger" value=${perData.urlKeywords}>刪除</button></td>
                </tr>`
    }).join('')

    document.querySelector("#kwTable > tbody").innerHTML = trString;

    // 刪除按鈕 event
    document.querySelectorAll("#kwTable .btn-outline-danger").forEach(_btn => {
        _btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // alert(e.target.value);
            if (confirm(`delete this value ${e.target.value}?`)) {
                let targetIdx = groupArr.findIndex(data => data.urlKeywords === e.target.value);
                let targetToDel = groupArr[targetIdx];
                groupArr.splice(targetIdx, 1);
                e.target.closest("tr").remove();

                if(targetToDel.tabIds.length > 0) {
                    chrome.tabs.ungroup(targetToDel.tabIds, () => {
                        console.log('執行 ungroup');
                    }); 
                }

                // 從本地瀏覽器中刪除使用者輸入的資料
                chrome.storage.local.remove(['myGroupArr'], () => {
                    console.log(`資料自 Chrome local storage 刪除成功`);
                });

                // 更新 groupArr，重新儲存到 chrome
                chrome.storage.local.set({ 'myGroupArr': groupArr }, () => {
                    console.log(`更新 groupArr，重新儲存到 chrome`, groupArr);
                });
            }
        })
    })
})