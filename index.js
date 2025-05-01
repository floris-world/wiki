const title = sessionStorage.getItem('title') || '대문';
sessionStorage.removeItem('title');
history.replaceState(null, '', `/wiki/${title}`);
document.title = `${title} - 플레뢰`;

let content = '';
let documents = [];
const resultBox = document.getElementById('result');
const contentBox = document.getElementById('content');
const temp = /\{\{([^{}]+)\}\}/;
const tempVar = /<<([^<>]+)>>/;
let tempVars = {};
const func = /\$\{(.+?)\}/g;

const md = window.markdownit({ html: true })
.use(window.markdownitFootnote)
.use(window.markdownitMultimdTable, { headerless: true });

async function setContent(){
    const response1 = await fetch(`https://raw.githubusercontent.com/floris-world/wiki/main/docs/${title}.md`);
    content = await response1.text();
    
    // templates
    while(temp.test(content)){
        tempVars = {};
        
        let match = content.match(temp)[1].replaceAll('\n', '');
        
        while(match.includes('|')){
            match = match.replace(/\|([^|=]+)=([^|=]+)/, (m, variable, value) => {tempVars[variable] = value;return '';});
        }
        
        const response2 = await fetch(`https://raw.githubusercontent.com/floris-world/wiki/main/templates/${match}.md`);
        let replacing = await response2.text();
        
        while(tempVar.test(replacing)){
            replacing = replacing.replace(tempVar, (m, p1) => tempVars[p1] || '');
        }
        
        replacing = replacing.replace(func, (m, p1) => {return eval(p1);});
        console.log(`틀(파싱 전): ${replacing}`);
        
        replacing = md.render(replacing);
        console.log(`틀(파싱 후): ${replacing}`);
        
        content = content.replace(temp, replacing);
    }
    
    // functions
    content = content.replace(func, (m, p1) => {return eval(p1);});
    
    content = md.render(content);
    
    // custom
    content = content.replace(/(?<=[^\!])\[\[([^\[\]]+)\]\]/g, `<a href="./$1">$1</a>`);
    content = content.replace(/\!\[\[([^\[\]]+)\]\]/g, `<img src="./imgs/$1">`);
    
    content = `<h1>${title}</h1>` + content;
    contentBox.innerHTML = content;
}

async function setDocuments(){
    const response = await fetch(`https://raw.githubusercontent.com/floris-world/wiki/main/assets/tree.json`);
    documents = await response.json();
    documents = documents[0]['contents'].map(doc => doc['name'].slice(0,-3));
}

function search(s){
    resultBox.innerHTML = '';
    documents.filter(row => row.includes(s)).sort((a,b) => sort(a,b,s)).slice(0,8).forEach(docName => {
        resultBox.innerHTML += `<a href="./${docName}" style="color:var(--text);">${docName}</a>`;
    });
}

function sort(a,b,s){
    if(a.startsWith(s) && !b.startsWith(s)){
        return -1;
    }
    if(!a.startsWith(s) && b.startsWith(s)){
        return 1;
    }
    if(a.length > b.length){
        return -1;
    }
    if(a.length < b.length){
        return 1;
    }
    return 0;
}

function getDate(){
    const months = [
        ['Nymphel', 23], ['Violar', 23], ['Taraxa', 23], ['Trifolir', 22],
        ['Heliath', 23], ['Anemiar', 23], ['Rosath', 23], ['Mahalel', 22],
        ['Orchea', 23], ['Astere', 23], ['Iridia', 23], ['Belliar', 22],
        ['Lilar', 23], ['Alchemir', 23], ['Convella', 23], ['Narciel', 23]
    ];
    const today = new Date();
    const baseYear = today.getFullYear();
    const year = baseYear - 1402;
    
    const dayOfYear = Math.floor((today - new Date(baseYear, 0, 1)) / 86400000) + 1;

    let day = dayOfYear;
    let monthIndex = 0;
    for (; monthIndex < months.length; monthIndex++) {
        if (day <= months[monthIndex][1]) break;
        day -= months[monthIndex][1];
    }
    
    const monthName = months[monthIndex][0];
    
    return `${year}년 ${monthName} ${day}일`;
}

setContent();
setDocuments();
