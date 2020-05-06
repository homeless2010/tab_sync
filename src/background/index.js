import {
  getStorage
} from '@/utils'
import { Octokit }  from "@octokit/rest"

window.chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason == "install") {
    // 插件安装成功
  } else if (details.reason == "update") {
    // 插件升级成功
    // 插件安装成功后添加欢迎页面
  }
});

var settings = {
  tabs : [],
  userToken : '',
  github: null
};

chrome.runtime.onConnect.addListener(function (externalPort) {
  externalPort.onDisconnect.addListener(function() {
  var ignoreError = chrome.runtime.lastError;
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
              settings.tabs.push(tab)
          }
      }
      getStorage(["tab_sync_user_token"], function(result) {
        settings.userToken = result["tab_sync_user_token"];
          settings.github = new Octokit({
            auth: `token ${settings.userToken}`
          })
          getStorage(["tab_sync_gist_id"], async function(result) {
            var gistId = result["tab_sync_gist_id"];
            if(gistId){
              //console.log(gistId)
              const promise = settings.github.gists.get({ gist_id: gistId });
              const res = await promise.catch(err => {
                // console.log(err)
              });
              if (res) {
                res.data.files['tab.json'].content = JSON.stringify(settings.tabs)
                settings.github.request("PATCH /gists/:gist_id",res.data);
              }
            }
          });
         })
      });
    });
  });
});

