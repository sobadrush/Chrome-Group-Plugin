/**
 * Chrome Extension ���g�о�: https://ithelp.ithome.com.tw/articles/10186039
 * 
 * chrome.tabGroups �x����: https://developer.chrome.com/docs/extensions/reference/tabGroups/#type-TabGroup
 * chrome.tabs �x����: https://developer.chrome.com/docs/extensions/reference/tabs/
 */

const colorList = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

// var groupArr = [
//     { name: 'Youtube', urlKeywords: 'youtube', color: 'pink', tabIds: [] },
//     { name: 'Instagram', urlKeywords: 'instagram', color: 'yellow', tabIds: [] }
// ];
var groupArr = []; // �w�]�Ű}�C

let getGroupArr = () => {
    // �q���a�s������Ū���ϥΪ̿�J�����
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['myGroupArr'], (result) => {
            console.log(`�� Chrome local storage Ū����Ʀ��\:`, result);
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

// ���o _min ~ _max �������ü�
let genRandomInt = (_min, _max) => {
    return Math.floor(Math.random() * _max) + _min;
}

// �s�x��ƨ� const & chrome
let doSaveData = (_keywords) => {
    let dataToSave = { name: _keywords, urlKeywords: _keywords, color: colorList[genRandomInt(0, colorList.length - 1)], tabIds: [] };

    // �x�s�� array
    groupArr.push(dataToSave);

    // �N�ϥΪ̿�J������x�s�쥻�a�s������
    chrome.storage.local.set({ 'myGroupArr': groupArr }, () => {
        console.log(`����x�s�� Chrome local storage ���\`, groupArr);
    });
}

// �j�w�u�s�W�v���s�ƥ� �� �`�N�Gkeypress�ƥ�L�k�b chrome extension �W�@��
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

// ������s
document.querySelector('#execBtn').addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
        groupTabsByUrlKeywords(tabs);
    });
});

// �����s�ի��s
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

    await getGroupArr(); // ���o groupArr
    groupArr.forEach(gp => {
        if (gp.tabIds.length > 0) {
            chrome.tabs.ungroup(gp.tabIds, () => {
                console.log('���� ungroup');
            }); 
        }
    })

    // chrome.tabs.query({ currentWindow: true }, (tabs) => {
    //     tabs.forEach((tab) => {
    //         chrome.tabs.ungroup(tab.id, () => {
    //             console.log('���� ungroup');
    //         });            
    //         // if (tab.groupId !== -1) {
    //         //     chrome.tabs.group({ tabIds: tab.id, createProperties: { windowId: tab.windowId } }, (group) => {
    //         //         chrome.tabs.ungroup(group.id, () => {});
    //         //     });
    //         // }
    //     });
    // });
});

// �d�ߥثe�]�w����r
document.querySelector("#queryKeywords").addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector("#kwTable > tbody tr")?.remove();

    await getGroupArr(); // ���o groupArr

    let trString = groupArr.map((perData, idx) => {
        return `<tr>
                    <th scope="row">${idx + 1}</th>
                    <td>${perData.urlKeywords}</td>
                    <td><button type="button" class="btn btn-sm btn-outline-danger" value=${perData.urlKeywords}>�R��</button></td>
                </tr>`
    }).join('')

    document.querySelector("#kwTable > tbody").innerHTML = trString;

    // �R�����s event
    document.querySelectorAll("#kwTable .btn-outline-danger").forEach(_btn => {
        _btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // alert(e.target.value);
            if (confirm(`delete this value ${e.target.value}?`)) {
                groupArr.splice(groupArr.findIndex(data => data.urlKeywords === e.target.value), 1);
                e.target.closest("tr").remove()

                // �q���a�s�������R���ϥΪ̿�J�����
                chrome.storage.local.remove(['myGroupArr'], () => {
                    console.log(`��Ʀ� Chrome local storage �R�����\`);
                });
            }
        })
    })
})

// �ھ� url ��������r�A�N�� group
const groupTabsByUrlKeywords = async (tabs) => {
    tabs.forEach((tab) => {
        for (let group of groupArr) {
            if (tab.url.includes(group.urlKeywords)) {
                group.tabIds.push(tab.id);

                // �N�ϥΪ̿�J������x�s�쥻�a�s������
                chrome.storage.local.set({ 'myGroupArr': groupArr }, () => {
                    console.log(`�ھ�����r������Apush tabIds ��A�x�s�� Chrome local storage ���\`, groupArr);
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