<!-- SPPDB0010 위험기계기구 안전검사 / 위험기계 정보 일괄변경 -->
<!-- SI2팀 김성근 2024-04-09 -->

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from "@hiway/stores/user";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from "@/utils/saveFlowHelper"
import Message from '@hiway/utils/notify'
import {getCodeList, commonSearchApi} from '@hiway/api/commonApi'
import dayjs from "dayjs"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore =  useUserStore()
const grdMain = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false);
const searchParams = reactive({
  CMPNY_DIV:userStore.cmpnyDiv,
  EQUIP_KIND:'',
  AUTO_CLOSE : 'Y'
})

const codeList =reactive([])
const emit = defineEmits(["ConfirmPop"])

const openPopup = () => {
  dialog.value = true
  initCodeList()
  onButtonsClick({id:'btnSearch'})
}

const onButtonsClick = (btn)=>{
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(true)
      .run();
  }else if(btn.id ==='btnConfirm'){
    let chkRow = grdMain.value.getGridView().getCheckedRows()
    let params = []

    chkRow.forEach(async fe => {
      let row = grdMain.value.getDataProvider().getJsonRow(fe)
       params.push(row)    
    })
    emit("ConfirmPop" , params) 

    //자동닫기
    console.log('searchParams.AUTO_CLOSE', searchParams.AUTO_CLOSE)
    if(searchParams.AUTO_CLOSE === 'Y'){
     dialog.value = false
    }

  }else if(btn.id ==='btnClose'){
    dialog.value = false
  }
}

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {edit: { editable: false }, checkBar: {visible: true}},
  keys : ['EQUIP_KIND','EQUIP_SEQ'],
  fields : [ 
    { fieldName: 'EQUIP_KIND',lookupDisplay: true, dataType: 'text', header: { text: t('장비군') } },
    { fieldName: 'EQUIP_SEQ', dataType: 'text', header: { text: t('장비군') }, visible:false },
    { fieldName: 'MANAGE_DEPT_NM', dataType: 'text',header: { text: t('관리부서') }, visible:false },
    { fieldName: 'MANAGE_GUA_NM',styleName: "left-column", dataType: 'text',header: { text: t('관리과') } , visible:false},
    { fieldName: 'MANAGE_TEAM_NM',styleName: "left-column", dataType: 'text',header: { text: t('관리팀') }, visible:false },
    { fieldName: 'CHARGE_EMP_NM', dataType: 'text',header: { text: t('관리담당자') } },
    { fieldName: 'ITMANAGER_EMPNM', dataType: 'text',header: { text: t('사용자부서 담당자') } },
    { fieldName: 'EQUIP_NO', dataType: 'text',header: { text: t('장비번호') } },
    { fieldName: 'TRMS_NO', dataType: 'text',header: { text: t('설비번호(TRMS)') } },
    { fieldName: 'STATUS', lookupDisplay: true, dataType: 'text',header: { text: t('장비상태') } },
    { fieldName: 'RETEST_DT', dataType: 'text',header: { text: t('차기검사년도') } },
    { fieldName: 'INSTALL_PLACE',styleName: "left-column", dataType: 'text',header: { text: t('설치위치') } },
    { fieldName: 'INSTALL_DT', header: { text: t('설치일자') } ,editor: { datetimeFormat: "yyyy-MM-dd" },dataType: "datetime",datetimeFormat: "yyyy-MM-dd",},
    { fieldName: 'MAKER',styleName: "left-column", dataType: 'text',header: { text: t('제조사') } },
    { fieldName: 'USE_DEPT_NM',styleName: "left-column", dataType: 'text',header: { text: t('사용부서') } },
    { fieldName: 'TEST_DIV_NM', dataType: 'text',header: { text: t('구분') } , visible:false},
    { fieldName: 'TEST_DT',header: { text: t('인증/검사일자') },editor: { datetimeFormat: "yyyy-MM-dd" },dataType: "datetime",datetimeFormat: "yyyy-MM-dd" },
    { fieldName: 'PASS_NO', dataType: 'text',header: { text: t('합격번호') } },
    { fieldName: 'EXPIRATION', dataType: 'text',header: { text: t('검사유효기간') } },
    { fieldName: 'TEST_AGENCY_NM',styleName: "left-column", dataType: 'text',header: { text: t('검사기관') } },
    { fieldName: 'INSPECTOR', dataType: 'text',header: { text: t('검사원') } },
    { fieldName: 'REMARK', dataType: 'text',header: { text: t('비고') } },
    
    { fieldName: 'CERT_FILE_YN', dataType: 'text',header: { text: t('인증서') } , visible:false},
    { fieldName: 'ETC_FILE_YN', dataType: 'text',header: { text: t('첨부') }, isFile: { value: true, align: "right", }, visible:false},
    { fieldName: 'NONTEST_YN', dataType: 'text',header: { text: t('검사제외') } , visible:false},
    { fieldName: 'ETC_FILE_ID', dataType: 'text',header: { text: t('파일아이디') },visible:false },
    { fieldName: 'LOG_CFM_CNT', dataType: 'text',visible:false },
    
      // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'EQUIP_COMPANY', dataType: 'text', visible:false },
  ],
  columns : [],
  columnLayout: [
      'EQUIP_KIND',
      'MANAGE_DEPT_NM', 
     'MANAGE_GUA_NM', 
     'MANAGE_TEAM_NM', 
     'CHARGE_EMP_NM',
     'ITMANAGER_EMPNM',
     'EQUIP_NO', 
     'TRMS_NO', 
     'STATUS',
     'RETEST_DT', 
     {
      name: '설치사양',
      direction: 'horizontal',
      items: [
        'INSTALL_PLACE',
        'INSTALL_DT',                          
        'MAKER',                          
      ],
      header: {
        text: t('설치사양'),
      },
    },
    'USE_DEPT_NM',
    {
      name: '안전검사/인증',
      direction: 'horizontal',
      items: [
        'TEST_DIV_NM',
        'TEST_DT',                          
        'PASS_NO',                          
        'EXPIRATION',                                                
        'TEST_AGENCY_NM',                          
        'INSPECTOR',                                                
      ],
      header: {
        text: t('안전검사/인증'),
      },
    },
    'REMARK'
  ],
})

grdMainProps.columns = grdMainProps.fields

defineExpose({
  openPopup,
});

const searchData = () => {

  let search = {}

   search.CMPNY_DIV = searchParams.CMPNY_DIV
   search.EQUIP_KIND = searchParams.EQUIP_KIND

  return commonSearchApi({queryId: "SPPDA0010_SEARCH_01", param: search })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const initCodeList = () => {
  Promise.all([

    getCodeList('HHIFB120'),
    getCodeList("HHIF810"), //장비군
    getCodeList("HHIFB110"), //장비상태
    getCodeList("HHIZ000"),
  ]).then(res => {

    codeList.STATUS = res[0].ORESULT_CUR
    codeList.EQUIP_KIND = res[1].ORESULT_CUR
    codeList.CMPNY_DIV = res[3].ORESULT_CUR
    codeList.EQUIP_KIND.unshift({ TXT: "전체", COD: ""  });

    grdMain.value.setBindingColumn("EQUIP_KIND",res[1].ORESULT_CUR,"COD","TXT");
    grdMain.value.setBindingColumn("STATUS",res[2].ORESULT_CUR,"COD","TXT");
  })
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1100"
    height="900"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging"></div>
    <v-card>
      <v-card-title>
    <IGridTitle
     :use-permission="false"
     :button-list="['btnSearch', 'btnConfirm','btnClose']"
     @click-button="onButtonsClick"
    >
    <template #editors >
      <v-sheet class="d-flex justify-space-between" width="900px">
      <v-checkbox :label="$t('자동닫기')" v-model="searchParams.AUTO_CLOSE" true-value="Y" false-value="N" /> 
      <div class="d-flex">
        <i-select
          :label="$t('회사구분')"
          width="220px"
          margin="10px"
          v-model="searchParams.CMPNY_DIV"
          :items="codeList.CMPNY_DIV"
          item-value="COD"
          item-title="TXT"
        />
        <i-select
          :label="$t('장비군')"
          width="180px"
          margin="10px"
          v-model="searchParams.EQUIP_KIND"
          :items="codeList.EQUIP_KIND"
          item-value="COD"
          item-title="TXT"
        />
      </div>
      </v-sheet>
    </template>
    </IGridTitle>
    </v-card-title>
    <v-card-text class="pa-0 px-2 content-area">
      <v-sheet class="fill-height">
        <div class="h-auto">
            <IGridTitle :title="$t('위험기계현황')" />            
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
        </div>
          </v-sheet>
    </v-card-text>
  </v-card>
  </v-dialog>
</template>
    
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
