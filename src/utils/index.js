/**
 * @description 工具
 * @author homeless2010
 * @date 2020/05/04
 */

 export function createWindow(createData,func){
    chrome.windows.create(createData, func);
 }
/**
 * 存储storage
 */
export function setStorage(obj, fn) {
    chrome.storage.local.set(obj, fn)
}

/**
 * 获取storage
 */
export function getStorage(obj, fn) {
    chrome.storage.local.get(obj, fn)
}

/**
 * hash
 */
export function hash(input){
    var hash = 5381;
    var i = input.length - 1;
        
    if(typeof input == 'string'){
        for (; i > -1; i--)
        hash += (hash << 5) + input.charCodeAt(i);
    }
    else{
        for (; i > -1; i--)
        hash += (hash << 5) + input[i];
    }
    var value = hash & 0x7FFFFFFF;
        
    var retValue = '';
    do{
        retValue += I64BIT_TABLE[value & 0x3F];
    }
    while(value >>= 6);
        
    return retValue;
}
