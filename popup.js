/**
 * Chrome Extension ���g�о�: https://ithelp.ithome.com.tw/articles/10186039
 * 
 * chrome.tabGroups �x����: https://developer.chrome.com/docs/extensions/reference/tabGroups/#type-TabGroup
 * chrome.tabs �x����: https://developer.chrome.com/docs/extensions/reference/tabs/
 */
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// �q���a�s������Ū���ϥΪ̿�J�����
const getGroupArr = () => {
    return new Promise((resolve, reject) => {
        let tmpArr = [];
        chrome.storage.local.get(['myGroupArr'], (result) => {
            console.log(`�� Chrome local storage Ū����Ʀ��\:`, result);
            if(result['myGroupArr']) {
                tmpArr = result['myGroupArr'];
            } else {
                tmpArr = [];
            }
            resolve(tmpArr);
        });
    });
}

// ���o _min ~ _max �������ü�
const genRandomInt = (_min, _max) => {
    return Math.floor(Math.random() * _max) + _min;
}

// �s�x��ƨ� const & chrome
const doSaveData = (_keywords) => {

    if(groupArr.find(xx => xx.urlKeywords.toLowerCase() === _keywords.toLowerCase())){
        alert(`�w��������r: ${_keywords}`);
        return;
    }

    let dataToSave = { name: _keywords, urlKeywords: _keywords, color: colorList[genRandomInt(0, colorList.length - 1)], tabIds: [] };

    // �x�s�� array
    groupArr.push(dataToSave);

    // �N�ϥΪ̿�J������x�s�쥻�a�s������
    chrome.storage.local.set({ 'myGroupArr': groupArr }, () => {
        console.log(`����x�s�� Chrome local storage ���\`, groupArr);
        // �M�ſ�J��
        document.querySelector('#keywordsInp').value = '';
        document.querySelector('#keywordsInp').focus();
    });
}

// ���m�޿�
const doReset = (kw) => {
    if(kw) {
        groupArr = groupArr.filter(x => x.urlKeywords === kw)
    }

    groupArr.forEach(x => {
        // console.log('x.tabIds', x.tabIds);
        let tabIdsArr = x.tabIds;
        tabIdsArr.splice(0);
    });
    
    // ��s groupArr�A���s�x�s�� chrome
    chrome.storage.local.set({ 'myGroupArr': groupArr }, () => {
        console.log(`[���m���s] ��s groupArr�A���s�x�s�� chrome`, groupArr);
    });
}

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
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const colorList = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

// var groupArr = [
//     { name: 'Youtube', urlKeywords: 'youtube', color: 'pink', tabIds: [] },
//     { name: 'Instagram', urlKeywords: 'instagram', color: 'yellow', tabIds: [] }
// ];
var groupArr = []; // �w�]�Ű}�C

// IIFAE �g�k�G Immediately Invoked Async Function Expression
~async function() {
    console.log(' ... IIFE - init ... ');
    groupArr = await getGroupArr();
    console.log('groupArr = ', groupArr);
}();

// �j�w�u�s�W�v���s�ƥ� �� �`�N�Gkeypress�ƥ�L�k�b chrome extension �W�@��
['click', 'keypress'].forEach(ee => {
    let elem = document.querySelector("#addBtn");
    switch (ee) {
        case 'click':
            elem.addEventListener(ee, (e) => {
                e.preventDefault();
                e.stopPropagation();
                let kwStr = document.querySelector('#keywordsInp').value;
                if(kwStr.length === 0 || /\s/.test(kwStr)){
                    alert("�п�J�r��I")
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
                        alert("�п�J�r��I")
                        return;
                    }
                    doSaveData(kwStr);
                }
            });
            break;
    }
});

// ������s
document.querySelector('#execBtn').addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    doReset(); // �ھ� keywords �M�Ź����� tabIds �}�C

    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
        groupTabsByUrlKeywords(tabs);
    });
});

// �����s�ի��s
document.querySelector('#cancelGroupBtn').addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    groupArr = await getGroupArr(); // ���o groupArr
    groupArr.forEach(gp => {
        if (gp.tabIds.length > 0) {
            chrome.tabs.ungroup(gp.tabIds, () => {
                console.log('���� ungroup');
            }); 
        }
    })
});

// ���m���s
// document.querySelector("#resetButton").addEventListener("click", (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if(confirm("�T�w���m�ܡH") === false){
//         return;
//     }
//     doReset();
// });

// �d�ߥثe�]�w����r
document.querySelector("#queryKeywords").addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector("#kwTable > tbody tr")?.remove();

    groupArr = await getGroupArr(); // ���o groupArr

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
                let targetIdx = groupArr.findIndex(data => data.urlKeywords === e.target.value);
                let targetToDel = groupArr[targetIdx];
                groupArr.splice(targetIdx, 1);
                e.target.closest("tr").remove();

                if(targetToDel.tabIds.length > 0) {
                    chrome.tabs.ungroup(targetToDel.tabIds, () => {
                        console.log('���� ungroup');
                    }); 
                }

                // �q���a�s�������R���ϥΪ̿�J�����
                chrome.storage.local.remove(['myGroupArr'], () => {
                    console.log(`��Ʀ� Chrome local storage �R�����\`);
                });

                // ��s groupArr�A���s�x�s�� chrome
                chrome.storage.local.set({ 'myGroupArr': groupArr }, () => {
                    console.log(`��s groupArr�A���s�x�s�� chrome`, groupArr);
                });
            }
        })
    })
})