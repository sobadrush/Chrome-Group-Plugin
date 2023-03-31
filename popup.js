/**
 * Chrome Extension ���g�о�: https://ithelp.ithome.com.tw/articles/10186039
 * 
 * chrome.tabGroups �x����: https://developer.chrome.com/docs/extensions/reference/tabGroups/#type-TabGroup
 * chrome.tabs �x����: https://developer.chrome.com/docs/extensions/reference/tabs/
 */

const colorList = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

const groupArr = [
    { name: 'Youtube', urlKeywords: 'youtube', color: 'pink', tabIds: [] },
    { name: 'Instagram', urlKeywords: 'instagram', color: 'yellow', tabIds: [] }
];

// ���o _min ~ _max �������ü�
let genRandomInt = (_min, _max) => {
    return Math.floor(Math.random() * _min) + _max;
}

// �����J������r
document.querySelector("#btn1").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    let kw = document.querySelector("#keywordsInp").value;
    groupArr.push({ name: kw, urlKeywords: kw, color: colorList[genRandomInt(0, colorList.length - 1)], tabIds: [] })
    document.querySelector("#keywordsInp").value = "";
    document.querySelector("#keywordsInp").focus();
})

// �d�ߥثe�]�w����r
document.querySelector("#queryKeywords").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector("#kwTable > tbody tr")?.remove();
    let trString = groupArr.map((perData, idx) => {
        return `<tr>
                    <th scope="row">${idx + 1}</th>
                    <td>${perData.urlKeywords}</td>
                    <td><button type="button" class="btn btn-sm btn-outline-danger" value=${perData.urlKeywords}>delete</button></td>
                </tr>`
    }).join('');
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
            }
        })
    })
})


chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
    groupTabsByUrlKeywords(tabs);
});

// �ھ� url ��������r�A�N�� group
const groupTabsByUrlKeywords = async (tabs) => {
    tabs.forEach(tab => {
        for (let group of groupArr) {
            if (tab.url.includes(group.urlKeywords)) {
                group.tabIds.push(tab.id);
            }
        }
    })

    groupArr.forEach(group => {
        if (group.tabIds.length > 0) {
            chrome.tabs.group({ tabIds: group.tabIds }, groupId => {
                chrome.tabGroups.update(groupId, { title: group.name, color: group.color })
            })
        }
    })
}