<template>
  <div id="app">
    <el-row>
      <el-col :span="6">
        <el-popover 
        placement="bottom"
        title="github授权"
        trigger="manual"
        v-model="isSync">
        <el-form ref="userForm" :model="userForm" size="mini" label-width="auto" :inline="true" >
          <el-form-item label="" inline-message prop="userToken" :rules="[{ required: true, message: '请输入token'}]" label-width="0px">
            <el-input v-model="userForm.userToken" placeholder="请输入github token" clearable />
          </el-form-item>
        <div style="text-align: center; margin: 0;">
          <el-button type="primary" size="mini" @click="handleSubmit">确定</el-button>
        </div>
        </el-form>
      <el-button slot="reference" circle icon="el-icon-upload" type="info" @click="isSync = !isSync"></el-button>
    </el-popover>
      </el-col>
      <el-col :span="18">
      <el-button type="primary" round @click="handleSaveTabs">一键保存至书签</el-button>
      </el-col>
    </el-row>
      <el-table 
        style="margin-top:10px;"
        :data="tabData"
        border
        max-height="460"
        height="460"
        :show-header="false"
      >
      <el-table-column type="expand" width="25px">
        <template slot-scope="props">
        <template v-for="(col,index) in props.row.childTabs"  >
          <div :key="index">
          <el-row :gutter="10">
            <el-col :span="2">
              <el-image
                style="width: 16px; height: 16px"
                :src="col.favIconUrl"
                :fit="contain">
              </el-image>
            </el-col>
            <el-col :span="22">
            <span style="text-algin:center;"><el-link @click="handleChildTabOpen(col,index)" :title="col.title.length > 15 ? col.title : null" type="primary" :underline="false">{{col.title.length > 15 ? col.title.substring(0,15) : col.title}}</el-link></span>
            </el-col>
          </el-row>
           <template v-if="index !== props.row.childTabs.length - 1">
              <hr>
             </template>
          </div>
          </template>
        </template>
      </el-table-column>
        <el-table-column
          v-for="(col,index) in tabColumns"
          :key="index"
          :prop="col.value"
          :label="col.title"
          :min-width="col.width?col.width:'50'"
          align="center"
          header-align="center"
        >
          <template slot-scope="scope">
            <span v-if="tabColumns[index].type==='opt'" style="" @click="handleOpenTab(scope.row,scope.$index)">
              <el-button title="打开" type="text" icon="el-icon-s-promotion" @click="handleOpenTab(scope.row,scope.$index)"></el-button>
            </span>
            <span v-else><el-button title="删除" type="text" icon="el-icon-delete" @click="handleDeleteTab(scope.row,scope.$index)"></el-button>{{ scope.row[tabColumns[index].value] }}</span>
          </template>
        </el-table-column>
      </el-table>
  </div>
</template>

<script>
import {
  setStorage,
  getStorage,
  hash
} from '@/utils'
import { Octokit }  from "@octokit/rest"
import { createTokenAuth } from "@octokit/auth-token";
export default {
  name: 'App',
  components: {
  },
  data() {
    return {
      isSync : false,
      github : null,
      userForm:{
        userToken : ''
      },
      userName: '',
      tabData : [
        // {
        //   title : '',
        //   childTabs:[{
        //     title : ''
        //   }]
        // }
      ],
      tabColumns : [
        { title: 'tab', value: 'title', width : 100 },
        { title: '操作', type: 'opt', width : 35 }
      ],
      GIST_JSON: {
        description: "Tab Sync Settings Gist",
        public: false,
        files: {
          "tab.json": {
            content: "// Empty"
          }
        }
      }
    }
  },
  async created(){
    chrome.runtime.connect();
    // chrome.extension.getBackgroundPage()
    // chrome.storage.local.remove(['tab_sync_gist_id']);
    // chrome.storage.local.remove(['tab_sync_ids']);
   this.initStorage()
  // await this.initClientGithub()
  // await this.syncTabGist()
  },
  mounted(){
  },
  methods : {
    handleOpenTab(row,index){
      var urls = []
      for (var id in row.childTabs) {
          urls.push(row.childTabs[id].url)
      }
      chrome.windows.create({url : urls})
    },
    handleSaveTabs(){
      var vm = this
      chrome.windows.getCurrent(function(window){
        chrome.tabs.getAllInWindow(window.id, function(tabs) {
          var id = vm.$uuid.v4()
          var name = new Date().format('yyyy-MM-dd hh:mm:ss');
          var tabArray = new Array();
          for (var i=0; i<tabs.length; i++){
            var tempTab = {};
            tempTab['favIconUrl'] = tabs[i]['favIconUrl'];
            tempTab['id'] = tabs[i]['id'];
            tempTab['index'] = tabs[i]['index'];
            tempTab['title'] = tabs[i]['title'];
            tempTab['url'] = tabs[i]['url'];
            tabArray[i] = tempTab;
          }
          var data = new Object();
          data.id = id;
          data.title = name;
          data.childTabs = tabArray;
          //缓存tab id
          vm.cacheTabIds(id);
          //缓存tab单个信息
          var tabObj = {}
          tabObj["tab_sync_tab_"+id] = JSON.stringify(data)
          setStorage(tabObj);
          //添加到页面
          vm.tabData.push(data)
        });
		  });
    },
    cacheTabIds(id){
      getStorage(["tab_sync_ids"], function(result) {
        var ids = result["tab_sync_ids"];
        if(ids == null){
            ids = new Array();
        }else{
            ids = JSON.parse(ids);
        }
        if(Array.isArray(id)){
            for(var i in id){
                ids.push(id[i]);
            }
        }else{
            ids.push(id);
        }
        setStorage({"tab_sync_ids" : JSON.stringify(ids)});
      })
    },
    handleChildTabOpen(col,index){
      chrome.tabs.create({url : col.url});
    },
    handleDeleteTab(row,index){
      this.tabData.splice(this.tabData.findIndex(item => item.id === row.id), 1)
      this.removeTabIdFromCache(row.id);
      chrome.storage.local.remove(["tab_sync_tab_" + row.id]);

    },
    removeTabIdFromCache(id){
      getStorage(["tab_sync_ids"], function(result) {
        var ids = result["tab_sync_ids"];
        if(ids){
            ids = JSON.parse(ids);
            var index = ids.indexOf(id);
            if(index > -1){
                ids.splice(index, 1);
                setStorage({"tab_sync_ids" : JSON.stringify(ids)});
            }
        }
      });
    },
    syncTabGist(){
      var vm = this;
        getStorage(["tab_sync_gist_id"], async function(result) {
        var gistId = result["tab_sync_gist_id"];
        if(gistId){
          //console.log(gistId)
          const promise = vm.github.gists.get({ gist_id: gistId });
          const res = await promise.catch(err => {
            // console.log(err)
          });
          if (res) {
            if(hash(res.data.files['tab.json'].content) === hash(JSON.stringify(vm.tabData))){

            }else{
              // TODO 优化对比 
              vm.tabData = JSON.parse(res.data.files['tab.json'].content)
            }
            return res;
          }
        }else{
          vm.createGIST().then((res) => {
            setStorage({"tab_sync_gist_id" : res});
          })
         /*  (async () => {
            const auth = createTokenAuth(vm.userToken);
            const authentication = await auth();
            console.log(authentication)
          })() */
        }
      });
    },
    initClientGithub(){
      var vm = this
      vm.github = new Octokit({
            auth: `token ${vm.userForm.userToken}`
          });
          vm.github.users
        .getAuthenticated({})
        .then(res => {
          vm.userName = res.data.login;
          // vm.name = res.data.name;
          /* console.log(
            "Sync : Connected with user : " + "'" + vm.userName + "'"
          ); */
        })
        .catch(err => {
          console.error(err);
        });
    },
    async createGIST(){
      this.GIST_JSON.files['tab.json'].content = JSON.stringify(this.tabData)
      const res = await this.github.gists.create(this.GIST_JSON);
      if (res.data && res.data.id) {
        return res.data.id.toString();
      } else {
        // console.error("ID is null");
        // console.log("Sync : " + "Response from GitHub is: ");
        // console.log(res);
      }
    },
    handleSubmit(){
      var vm = this;
      vm.$refs['userForm'].validate((valid) => {
          if (valid) {
            vm.isSync = !vm.isSync
            setStorage({"tab_sync_user_token" :  vm.userForm.userToken});
          } else { 
            console.log('error submit!!')  
           }
        })
    },
    initStorage(){
      var vm = this
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
                vm.tabData.push(tab)
            }
        }
          getStorage(["tab_sync_user_token"], function(result) {
              vm.userForm.userToken = result["tab_sync_user_token"];
              vm.initClientGithub()
              vm.syncTabGist()
            })
          });
      });
    }
  }
}
</script>
<style scoped>
/deep/ .el-table__expanded-cell{
padding: 5px 5px;
}
/deep/ .el-popover--plain{
  padding: 0px 0px;
}
</style>
<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  margin-top: 10px;
}
.el-popover .el-popover__title{
  font-weight:600;
  font-size:12px;
}
</style>
