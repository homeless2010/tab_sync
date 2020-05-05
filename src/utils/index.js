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

