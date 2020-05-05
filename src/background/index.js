import {
  getStorage
} from '@/utils'

window.chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason == "install") {
    // 插件安装成功
  } else if (details.reason == "update") {
    // 插件升级成功
    // 插件安装成功后添加欢迎页面
  }
});

var tabs_ = []
   //初始化数据
   getStorage(["tab_sync_ids"], function(result) {
    var ids = result["tab_sync_ids"];
    if(ids){
      ids = JSON.parse(ids);
    }
    var idArray = new Array();
    for (var id in ids) {
        idArray[id] = "tab_sync_tab_"+ids[id];
    }
    getStorage(idArray, function(result) {
      if(result){
          for(var index in result){
              var tab = JSON.parse(result[index]);
              tabs_.push(tab)
          }
      }
    });
});
export default tabs_