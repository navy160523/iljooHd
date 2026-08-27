<!--
  화면명 : 비상조치계획 - 추가팝업
  화면개요 : 메인 화면
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IButtonList from '@/components/IButtonList.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { isEmpty, isNullOrUndefined } from "@/@core/utils"
import { useLogsStore } from '@/@hiway/stores/logs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import { commonBigUploadFilesApi, commonDeletFilesApi } from "@hiway/api/commonFileApi"
import { useCommonStore } from '@/@hiway/stores/common'
import { useRoute } from 'vue-router'
import { cloneDeep } from 'lodash-es'
import IUpload from '@/components/IUpload.vue'

const emit = defineEmits(['upData'])

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const commonStore = useCommonStore()
const route = useRoute()
const userStore = useUserStore()
const fileUpload1 = ref(null)
const fileUpload2 = ref(null)
const menuTitle = ref(null)
// const fileUploadButton = reactive(["btnDelete"])
const titleButton = reactive(['btnUpdate', 'btnClose'])
const isAdmin = ref(0)
const DIV = ref(false)
const DIVV = ref(false)
const ADD_DIV = ref(false)
const ADD_DIVV = ref(false)
const valYN = ref(false)
const fileCount = ref(0);
const fileCount2 = ref(0);
const saveParams = reactive({});
let isPopupOpen = false;
const componentKey = ref(0);
const isVisibled = ref(true)
const reloadComponent = async () => {
  componentKey.value++;
};
const isPopupOpening = ref(true);
// 업로드 length
let prevLength = -1;
// 저장메세지 
let flag = false

const dialog = ref(false)
const titleInfo = reactive({
  process: '',
  item: ''
})

const searchParam = reactive({
  CMPNY_DIV : '',
  BSNS_CD: '',
  BSNS_NM: '',
  DEPT_CD: '',
  DEPT_NM: '',
  PROCESS_CD: '',
  PROCESS_NM: '',
})

const codeList = reactive({
})

const initCodeList = () => {
}

const create_UUID = () => {
  let dt = new Date().getTime()
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)
    
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
const guid = ref(create_UUID());


// 팝업 초기세팅
const openPopup = async (data) => {
  isPopupOpening.value = true;
  // console.log("data", data)
  // guid.value = create_UUID() 
  // console.log("guid", guid.value)

  // FYN은 Y면 팝업에서 새로운 파일아이디 생성, Y가 아니면 다운로드위해서 기존 파일아이디 사용
  // 메인그리드에서 추가버튼으로 팝업을 열면 무조건 새로운 파일아이디 생성
  if (data.FYN === 'Y') {
    guid.value = create_UUID();        // 새로 생성
  } else {
    guid.value = data.FILEID;          // 기존 값 재사용
  }
  
  Object.assign(saveParams, {
    // HIST_ID: data.HIST_ID,
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: data.BSNS_CD,
    BSNS_NM: data.BSNS_NM,
    DEPT_CD: data.DEPT_CD,
    DEPT_NM: data.DEPT_NM,
    PROCESS_CD: data.PROCESS_CD,
    PROCESS_NM: data.PROCESS_NM,
    IDX_SEQ: data.IDX_SEQ,
    STATUS: '',
    WDATE: '',
    REMARK: data.FYN === 'Y' ? '' : data.REMARK, 
    FILEID: guid.value,
    RESULT_FILEID: '',
    USER_NM: userStore.userName,
    // 팝업 저장 구분자 ( 비고 저장 후 파일첨부 가능하게 )
    // 변경이력에서 열면 FYN은 N이고 이때는 SAVEYN이 Y
    SAVEYN: data.FYN === 'N' ? 'Y' : 'N',
  });
  
  menuTitle.value.disableBtn(['btnUpdate'], false);
  isVisibled.value = true
  await nextTick();

  // SAVEYN은 팝업 저장 구분자
  if(saveParams.SAVEYN === 'N'){
    fileUpload1.value.diableFileUploadButton(['btnDelete', 'btnDownLoad'])
    isVisibled.value = false
  }

  // FYN === 'Y'는 추가버튼으로 열었을때
  // if(data.FYN === 'Y'){
  //   menuTitle.value.disableBtn(['btnUpdate'], true)
  // }else if(data.FYN === 'N' && data.NEW === 'N') {
  //   menuTitle.value.disableBtn(['btnUpdate'], false)
  // }

  // 최신 변경이력이 아닐 경우
  if(data.NEW === 'N'){
    menuTitle.value.disableBtn(['btnUpdate'], true)
    fileUpload1.value.diableFileUploadButton(['btnDelete'])
    isVisibled.value = false
  }

  // 이렇게해야 업로드컴포넌트에서 파일아이디로 파일 찾아옴
  if (fileUpload1.value?.setGuid) {
    fileUpload1.value.setGuid(saveParams.FILEID);
    fileUpload1.value.onButtonsClick({ id: "btnSearch" }); 
  }

  dialog.value = true
}

// saveFlowHelper에 비동기가 안먹어서 따로 선언
const update = async() => {
  await beforeSave();
  await saveData();
}

const onButtonsClick = async (btn) => {
  if(btn.id === 'btnClose') {
    closePopup()
  }else if(btn.id === 'btnUpdate') {
    if(flag) {
      new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .showMessage(false)
      .setQuery(saveData)
      // .setAfter(testAfter)
      .run()  
    }else {
      new saveFlowHelper(vm, t)
        .setBefore(beforeSave2)
        .setQuery(saveData2)
        .setAfter(() => {
          emit('upData')
        })
        .run()
    }
  }
}

// const testAfter = (res) => {

//   console.log('으어어어ㅓㅇ : ', res)
// }

const beforeSave = async () => {
  // console.log("저장전", saveParams)
  // if(!saveParams.FILEID) {
  //   Message.warn('파일을 첨부해주세요.');  
  //   return false;
  // }
  //IDX_SEQ + 1
  const currentSeq = Number(saveParams.IDX_SEQ || 0);  // null이나 ''일 경우 0 처리
  saveParams.IDX_SEQ = currentSeq + 1;

  // let WDATEE = saveParams.WDATE;

  // if (WDATEE) {
  //     if (typeof WDATEE === 'string') {
  //       // YYYY-MM-DD → 하이픈 제거
  //       if (/^\d{4}-\d{2}-\d{2}$/.test(WDATEE)) {
  //         WDATEE = WDATEE.replace(/-/g, '');
  //       }
  //     }
  //   }
  return true;
}

const saveData = async() => {
  // console.log("저장전", saveParams);
  flag = false
  const res = await Promise.all([
    commonExecuteApi({ queryId : 'SPPFM0010_SAVE_01', list: [saveParams] })
  ])
  return res[0]
}


const beforeSave2 = () => {
  // if(!saveParams.FILEID) {
    //   Message.warn('파일을 첨부해주세요.');  
    //   return false;
    // }
    //IDX_SEQ + 1
    const currentSeq = Number(saveParams.IDX_SEQ || 0);  // null이나 ''일 경우 0 처리
    saveParams.IDX_SEQ = currentSeq + 1;
    saveParams.STATUS = 'Y';
    saveParams.WDATE = dayjs().format('YYYYMMDD');
    saveParams.FILEID = ''  // 파일첨부가 아닌 버튼으로 저장 시 파일아이디는 초기화
    
    // console.log("저장전", saveParams)
  // let WDATEE = saveParams.WDATE;

  // if (WDATEE) {
  //     if (typeof WDATEE === 'string') {
  //       // YYYY-MM-DD → 하이픈 제거
  //       if (/^\d{4}-\d{2}-\d{2}$/.test(WDATEE)) {
  //         WDATEE = WDATEE.replace(/-/g, '');
  //       }
  //     }
  //   }
  return true;
}

const saveData2 = () => {
  // console.log("저장전", saveParams);
  flag = false
  saveParams.SAVEYN = 'Y'
  isVisibled.value = true
  fileUpload1.value.enableFileUploadButton(['btnDelete', 'btnDownLoad'])
  return commonExecuteApi({ queryId : 'SPPFM0010_SAVE_01', list: [saveParams] })
}

const closePopup = async () => {
  // 변경이력
  // if (fileCount.value === 0) {
  //   Message.warn('첨부파일은 필수입니다.');
  //   return;
  // }

  resetForm()
  guid.value = ''
  await reloadComponent();
  dialog.value = false
}

const resetForm = () => {
  // console.log('[resetForm 실행됨]');
  Object.keys(saveParams).forEach(key => {
    saveParams[key] = ''
  })
}

const uploaded1 = (val) => {
  // console.log('[uploaded1 실행됨]', val);
  // valYN.value = "Y"
  // console.log('val', val)
  // console.log('fileCount.value', fileCount.value)
  // if (!val?.fileId || fileCount.value === 0) {
  if (!val?.fileId) {
    Message.warn('파일 업로드에 실패했습니다.');
    return;
  }
  saveParams.FILEID = val.fileId;
  // console.log("파일아이디1", saveParams.FILEID)
  isPopupOpening.value = false;

  // saveParams.STATUS = 'Y';
  // saveParams.WDATE = dayjs().format('YYYYMMDD');

  // val.fileId = ''

  // onButtonsClick({ id: "btnUpdate" })
  // emit('upData')

}

// IUPLOAD 컴포넌트에서 파일 삭제시에도 val에 파일아이디가 담겨옴 ( db에 삭제는 됨 )
// 그래서 length를 받아와서 0이면 빈값으로 저장
const onDataLength = async (length) => {
  if (length === prevLength) {
    // console.log('[중복 length] 무시됨:', length);
    return;
  }
  // console.log("length", length)
  prevLength = length;
  fileCount.value = length

  // console.log("isPopupOpening.value", isPopupOpening.value) 

  if (isPopupOpening.value) {
    // console.log('[onDataLength 무시됨] 팝업 열림 직후');
    return;
  }

  await nextTick();

  // console.log("next파일숫자", fileCount.value)
  if (fileCount.value === 0) {
    saveParams.FILEID = ''; 
    menuTitle.value.disableBtn(['btnUpdate'], true)
    // Message.warn(t('파일을 업로드해주세요.'));
    // return;
  }
  // else if (fileCount.value > 0) {
  // }
  flag = true
  menuTitle.value.disableBtn(['btnUpdate'], false)
  saveParams.STATUS = 'Y';
  saveParams.WDATE = dayjs().format('YYYYMMDD');
  // console.log("파일아이디1", saveParams.FILEID)
  //await onButtonsClick({ id: 'btnUpdate' });

  // console.log('1111')
  await update();
  // console.log('22222')
  emit('upData');
  // console.log('33333')

}

watch(() => saveParams.FILEID, (val) => {
  // console.log('[FILEID 변경됨]', val);
});

defineExpose({
  openPopup
})

onMounted(() => {
    initCodeList()
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="700"
    height="800"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">
      <span>비상조치 계획</span>
    </div>
    <v-card class="pa-3 fill-height" style="background-color: white" rounded="0">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="titleButton"
          :hiddenManuel="true"
          @click-button="onButtonsClick"
        >
      </IMenuTitle>
      </v-card-title>
      <!-- style="height: ;" -->
      <v-card-text class="pa-2 pt-0">
        <v-container fluid class="searchArea fill-height pa-0">
          <VCol style="height: 100%;">
            <VCol class="pa-0 mb-4">
              <div class="d-flex mb-3">
                    <i-input
                      v-model="saveParams.BSNS_NM"
                      label-width="50px"
                      width="250px"
                      :label="$t('사업부')"
                      disabled
                    />
                    <i-input
                      v-model="saveParams.DEPT_NM"
                      label-width="50px"
                      width="250px"
                      :label="$t('부서')"
                      disabled
                    />
              </div>
              <div class="mb-3">
                <i-input
                      v-model="saveParams.PROCESS_NM"
                      label-width="50px"
                      width="500px"
                      :label="$t('공정설비')"
                      disabled
                    />
              </div>
            </VCol>

            <div class="d-flex flex-column">
              <div class="d-flex flex-wrap mb-3">
                  <i-input
                     :label="$t('비고')"
                     labelWidth="50px"
                     type="text"
                     width="500px"
                     v-model="saveParams.REMARK"
                     class="mb-3"
                   >
                   </i-input>
              </div>  

              <p v-if="saveParams.SAVEYN === 'N'" class="text-red">※ 내용 저장 후 파일을 업로드 하실 수 있습니다.</p>

                <div style="height: 440px;" class="mb-3" :key="componentKey">
                  <IUpload
                    ref="fileUpload1"
                    @uploaded="uploaded1"
                    grid-title="PSM 비상조치계획 파일첨부"
                    :guid2="saveParams.FILEID"
                    @dataLength="onDataLength"
                    :isVisibled="isVisibled"
                    />
                    <!-- :guid2="guid" -->
                    <!-- :isVisibled="(saveParams.DIV =='Y' || saveParams.ADD_DIV == 'Y') ? false : true" -->
                    <!-- DIV는 서브그리드에서 열때 넘기는 구분자, ADD_DIV는 추가버튼으로 열때 넘기는 구분자 -->
                    <!-- 서브그리드에서 열면 최신이력(DIV = N)을 제외하고 업로드가 안보여야함 -->
                    <!-- 추가버튼으로 열면 저장전까진 업로드가 안보여야함 -->
                    <!-- <IUpload
                    ref="fileUpload2"
                    @uploaded="uploaded1"
                    @dataLength="onDataLength1"
                    auto-upload
                    :guid2="saveParams.RESULT_FILEID"
                    grid-title="훈련결과 파일첨부"
                    /> -->
                    <!-- :isVisibled="(saveParams.DIV =='Y' || saveParams.ADD_DIV == 'Y') ? false : true" -->
                </div>
                <!-- <div style="height: 320px;"> -->
                    <!-- <IUpload
                    ref="fileUpload2"
                    @uploaded="uploaded2"
                    @dataLength="onDataLength1"
                    auto-upload
                    :guid2="guid"
                    grid-title="훈련결과 파일첨부"
                    /> -->
                    <!-- :isVisibled="(saveParams.DIV =='Y' || saveParams.ADD_DIV == 'Y') ? false : true" -->
                <!-- </div> -->
            </div>
          </VCol> 
        </v-container>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>