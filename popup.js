/**
 * Chrome Extension 撰寫教學: https://ithelp.ithome.com.tw/articles/10186039
 * 
 * chrome.tabGroups 官方文件: https://developer.chrome.com/docs/extensions/reference/tabGroups/#type-TabGroup
 * chrome.tabs 官方文件: https://developer.chrome.com/docs/extensions/reference/tabs/
 */

const colorList = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

// var groupArr = [
//     { name: 'Youtube', urlKeywords: 'youtube', color: 'pink', tabIds: [] },
//     { name: 'Instagram', urlKeywords: 'instagram', color: 'yellow', tabIds: [] }
// ];
var groupArr = []; // 預設空陣列

let getGroupArr = () => {
    // 從本地瀏覽器中讀取使用者輸入的資料
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['myGroupArr'], (result) => {
            console.log(`自 Chrome local storage 讀取資料成功:`, result);
            if(result['myGroupArr']) {
                groupArr = result['myGroupArr'];
            } else {
                groupArr = [];
            }
            resolve("get data done.");
        });
    });
}

// IIFE
(async () => {
    console.log(' ... IIFE - init ... ');
    await getGroupArr();
})();

// 取得 _min ~ _max 之間的亂數
let genRandomInt = (_min, _max) => {
    return Math.floor(Math.random() * _max) + _min;
}

// 存儲資料到 const & chrome
let doSaveData = (_keywords) => {
    let dataToSave = { name: _keywords, urlKeywords: _keywords, color: colorList[genRandomInt(0, colorList.length - 1)], tabIds: [] };

    // 儲存到 array
    groupArr.push(dataToSave);

    // 將使用者輸入的資料儲存到本地瀏覽器中
    chrome.storage.local.set({ 'myGroupArr': groupArr }, () => {
        console.log(`資料儲存至 Chrome local storage 成功`, groupArr);
    });
}

// 綁定「新增」按鈕事件 → 注意：keypress事件無法在 chrome extension 上作用
['click', 'keypress'].forEach(ee => {
    let elem = document.querySelector("#addBtn");
    switch (ee) {
        case 'click':
            elem.addEventListener(ee, (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                let kw = document.querySelector('#keywordsInp').value;
                doSaveData(kw);
            
                document.querySelector('#keywordsInp').value = '';
                document.querySelector('#keywordsInp').focus();
            });
            break;
        case 'keypress': // not working
            elem.addEventListener(ee, (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    let kw = document.querySelector('#keywordsInp').value;
                    doSaveData(kw);
                
                    document.querySelector('#keywordsInp').value = '';
                    document.querySelector('#keywordsInp').focus();
                }
            });
            break;
    }
});

// 執行按鈕
document.querySelector('#execBtn').addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
        groupTabsByUrlKeywords(tabs);
    });
});

// 取消群組按鈕
document.querySelector('#cancelGroupBtn').addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // chrome.tabGroups.query({}, (groups) => {
    //     groups.forEach((group) => {
    //         console.log('Group ID:', group.id);
    //         chrome.tabs.ungroup(group.id);
    //     });
    // });

    // chrome.tabs.ungroup(
    //     tabIds: number | [number, ...number[]],
    //     callback?: function,
    //   )

    await getGroupArr(); // 取得 groupArr
    groupArr.forEach(gp => {
        if (gp.tabIds.length > 0) {
            chrome.tabs.ungroup(gp.tabIds, () => {
                console.log('執行 ungroup');
            }); 
        }
    })

    // chrome.tabs.query({ currentWindow: true }, (tabs) => {
    //     tabs.forEach((tab) => {
    //         chrome.tabs.ungroup(tab.id, () => {
    //             console.log('執行 ungroup');
    //         });            
    //         // if (tab.groupId !== -1) {
    //         //     chrome.tabs.group({ tabIds: tab.id, createProperties: { windowId: tab.windowId } }, (group) => {
    //         //         chrome.tabs.ungroup(group.id, () => {});
    //         //     });
    //         // }
    //     });
    // });
});

// 查詢目前設定關鍵字
document.querySelector("#queryKeywords").addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector("#kwTable > tbody tr")?.remove();

    await getGroupArr(); // 取得 groupArr

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
                groupArr.splice(groupArr.findIndex(data => data.urlKeywords === e.target.value), 1);
                e.target.closest("tr").remove()

                // 從本地瀏覽器中刪除使用者輸入的資料
                chrome.storage.local.remove(['myGroupArr'], () => {
                    console.log(`資料自 Chrome local storage 刪除成功`);
                });
            }
        })
    })
})

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