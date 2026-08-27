<!--
  화면명 : 공정위험성평가 - 추가팝업
  화면개요 : 메인 화면
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonSearchnoAuthApi
} from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
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
import IUpload_NoAuth from '@/components/IUpload_NoAuth.vue'

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
const titleButton = reactive(['btnClose'])
const isAdmin = ref(0)
const DIV = ref(false)
const DIVV = ref(false)
const ADD_DIV = ref(false)
const ADD_DIVV = ref(false)
const valYN = ref(false)
const fileCount = ref(0);
const fileCount2 = ref(0);

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
  EVAL_TYPE: [
    {COD: '0', TXT: '정기'},
    {COD: '1', TXT: '수시'},
  ],
  EVAL_TECH : [
    {COD: '0', TXT: 'HAZOP'},
    {COD: '1', TXT: 'K-PSR'},
    {COD: '2', TXT: 'CHECKLIST'},
  ]
})

const saveParam = reactive({
  // CMPNY_DIV : '',
  // BSNS_CD: '',
  // BSNS_NM: '',
  // DEPT_CD: '',
  // DEPT_NM: '',
  // PROCESS_CD: '',
  // PROCESS_NM: '',
  // REG_TYPE: '0',
  // IRR_TYPE: '1',
  // REG_TECH: '',
  // IRR_TECH: '',
  // REG_DT: '',
  // IRR_DT: '',
  // CONTENT: '',
  // REMARK: '',
  // REG_FILE_ID: '',
  // IRR_FILE_ID: '',
  // USER_ID: userStore.userId,
})

const initCodeList = () => {
  // codeList.EVAL_TYPE.unshift({ TXT: '선택', COD: '' })
  codeList.EVAL_TECH.unshift({ TXT: '선택', COD: '' })
}

// 팝업 초기세팅
const openPopup = async (data) => {
  // 변경이력에서 열때 ( 최신이력 N )
  DIV.value = ''
  // 변경이력에서 열고 SAVE02 타게하는 구분자
  DIVV.value = ''
  // 추가팝업에서 열때
  ADD_DIV.value = ''
  // 추가 팝업에서 파일업로드 버튼 비활성화
  ADD_DIVV.value = ''
  valYN.value = "";
  // console.log("최초DIV", DIV.value)
  // console.log("DIVV", DIVV.value)

  // debugger
  // console.log('open popup data: ', data)

  const res= await commonSearchnoAuthApi({ 
    queryId: 'SPPFJ0010_SEARCH_17', 
    param: {
      CMPNY_DIV : data.CMPNY_DIV,
      BSNS_CD   : data.BSNS_CD,
      DEPT_CD   : data.DEPT_CD,
      PROCESS_CD : data.PROCESS_CD,
      CHG_NO  : data.CHG_NO
    }})

  console.log(res);

  let resData=res.ORESULT_CUR[0]

  dialog.value = true
  
  Object.assign(saveParam, {
    // HIST_ID: data.HIST_ID,
    CMPNY_DIV: data.CMPNY_DIV,
    BSNS_CD: resData.BSNS_CD,
    BSNS_NM: resData.BSNS_NM,
    DEPT_CD: resData.DEPT_CD,
    DEPT_NM: resData.DEPT_NM,
    PROCESS_CD: resData.PROCESS_CD,
    PROCESS_NM: resData.PROCESS_NM,
    REG_CONTENT: resData.REG_CONTENT,
    IRR_CONTENT: resData.IRR_CONTENT,
    EVAL_TYPE: resData.REG_TECH=='0'?'0':'1',
    REG_TYPE: '0',
    REG_TECH: resData.REG_TECH,
    // REG_DT: data.REG_DT,
    REG_DT:  resData.REG_DT?dayjs(resData.REG_DT).format('YYYY-MM-DD'):dayjs().format('YYYY-MM-DD'),
    REG_FILE_ID: resData.REG_FILE_ID,
    IRR_TYPE: '1',
    IRR_TECH: resData.IRR_TECH,
    IRR_DT: resData.IRR_DT? dayjs(resData.IRR_DT).format('YYYY-MM-DD'):dayjs().format('YYYY-MM-DD'),
    IRR_FILE_ID: resData.IRR_FILE_ID,
    REMARK: resData.REMARK,
    USER_ID: userStore.userId,
    // 서브그리드 구분자
    DIV: data.DIV,
    // 결과 cell 구분자
    DIVYN: data.DIVYN,
    // SAVE구분자
    DIVV: data.DIVV,
    ADD_DIV: data.ADD_DIV,
    ADD_DIVV: data.ADD_DIVV,
    CHG_NO : data.CHG_NO
  });

  // console.log("팝업saveParam", saveParam)
  // console.log("save쿼리구분자", saveParam.DIVV)

  await nextTick(); // 렌더링 완료 보장

  // 추가버튼으로 팝업에 들어오면 DIV가 없음
  // 서브그리드에서 들어왔을때만 있기 때문에
  // 조건을 나눠서 버튼 활성화, 비활성화
  if (data.DIV !== undefined){
    DIV.value = data.DIV
    // console.log("DIV.value", DIV.value)
  }

  // N 최신이력, 수정가능
  if(DIV.value === 'N' || DIV.value === ''){
    menuTitle.value.disableBtn(['btnUpdate'], false)
    // fileUpload1.value.enableFileUploadButton(['btnFileUpload'])
    // fileUpload1.value.enableFileUploadButton(['btnDownLoad']) 
    // fileUpload1.value.enableFileUploadButton(['btnDelete'])
  }

  // Y일때는 수정불가능
  if(DIV.value === 'Y'){
    menuTitle.value.disableBtn(['btnUpdate'], true)
  }

  // console.log("ADD_DIVV", saveParam.ADD_DIVV)


  // DIV 변경이력에서 열때, 최신은 N
  // ADD_DIVV는 메인그리드에서 열때 버튼 비활성화
  if (DIV.value === 'Y' && fileUpload1.value) {
    fileUpload1.value.diableFileUploadButton(['btnFileUpload'])
    // fileUpload1.value.diableFileUploadButton(['btnDownLoad'])
    fileUpload1.value.diableFileUploadButton(['btnDelete'])
  }

  
  if(DIV.value === 'Y' && fileUpload2.value) {
    fileUpload2.value.diableFileUploadButton(['btnFileUpload'])
    // fileUpload2.value.diableFileUploadButton(['btnDownLoad'])
    fileUpload2.value.diableFileUploadButton(['btnDelete'])
  }
  
  if (saveParam.ADD_DIVV === 'Y' && fileUpload1.value) {
    fileUpload1.value.diableFileUploadButton(['btnFileUpload', 'btnDownLoad', 'btnDelete'])
  }


  // 최신 이력 아닐땐 수정 불가
  // await nextTick(); // 렌더링 완료 보장

  // // DIV가 N이면 수정가능 ( TRUE )
  // DIV.value = data.DIV === 'N'
  // console.log("DIV.value", DIV.value)
  // // 최신 정기, 수시가 아니면 DIV가 Y로 들어오고 FALSE 수정 불가

  // console.log("1",fileUpload1.value)
  // console.log("2",fileUpload2.value)
  
  // if(DIV.value) {
  //   menuTitle.value.disableBtn(['btnUpdate'], false)
  // }
  
  // // false일때 버튼 disabled
  // if(!DIV.value) {
  //   menuTitle.value.disableBtn(['btnUpdate'], true)
  // }

  // if (!DIV.value && fileUpload1.value) {
  //   fileUpload1.value.diableFileUploadButton(['btnFileUpload'])
  //   fileUpload1.value.diableFileUploadButton(['btnDownLoad']) 
  //   fileUpload1.value.diableFileUploadButton(['btnDelete'])
  // }

  // if(!DIV.value && fileUpload2.value) {
  //   fileUpload2.value.diableFileUploadButton(['btnFileUpload'])
  //   fileUpload2.value.diableFileUploadButton(['btnDownLoad']) 
  //   fileUpload2.value.diableFileUploadButton(['btnDelete'])
  // }

}

// 팝업에서 저장 전 정기, 수시 변경할때 버튼 비활성화 유지
watch(
  () => saveParam.EVAL_TYPE,
  (newVal, oldVal) => {
    nextTick(() => {
    if (saveParam.ADD_DIVV === 'Y' && newVal === '1') {
    fileUpload2.value.diableFileUploadButton(['btnFileUpload', 'btnDownLoad', 'btnDelete'])
    }

    if (saveParam.ADD_DIVV === 'Y' && newVal === '0') {
    fileUpload1.value.diableFileUploadButton(['btnFileUpload', 'btnDownLoad', 'btnDelete'])
    }
  })
  }
)

const onButtonsClick = btn => {
  if(btn.id === 'btnClose') {
    closePopup() 
  }else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setConfirmMessage('저장 하시겠습니까?')
      .setQuery(saveParam.DIVV === 'Y' ? saveData2 : saveData)
      .setAfter(()=>{
        afterSave()
        // onButtonsClick({ id: 'btnClose' })
      })
      .run()
  }
}

const beforeSave = () => {
  // debugger
  if (saveParam.EVAL_TYPE === '0'){
    if(!saveParam.REG_TECH || !saveParam.REG_DT){
      Message.warn('정기 필수 항목을 모두 입력해주세요.'); 
      return false;
    }
  }

  if (saveParam.EVAL_TYPE === '1'){
    if(!saveParam.IRR_TECH || !saveParam.IRR_DT){
      Message.warn('수시 필수 항목을 모두 입력해주세요.');
      return false;
    }
  }

  if (saveParam.REG_DT) {
    saveParam.REG_DT = saveParam.REG_DT.replaceAll('-', '');
  }
  if (saveParam.IRR_DT) {
    saveParam.IRR_DT = saveParam.IRR_DT.replaceAll('-', '');
  }
  
  // console.log("저장전saveParam", JSON.parse(JSON.stringify(saveParam)))
  return true
}
 
const saveData = () => {
  // console.log("정확한 값1:", JSON.parse(JSON.stringify(saveParam)));
  return commonExecuteApi({ queryId : 'SPPFJ0010_SAVE_22', list: [saveParam] }) 
}

const saveData2 = () => {
  // console.log("정확한 값2:", JSON.parse(JSON.stringify(saveParam)));
  return commonExecuteApi({ queryId : 'SPPFJ0010_SAVE_23', list: [saveParam] })
}

const formatDate = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return '';
  return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
}

const afterSave = () => {
  saveParam.ADD_DIV = 'N';
  saveParam.ADD_DIVV = 'N';
  
  saveParam.REG_DT = formatDate(saveParam.REG_DT);
  saveParam.IRR_DT = formatDate(saveParam.IRR_DT);

  // console.log("saveParam.REG_DT", saveParam.REG_DT)
  // fileUpload1.value.isVisibled = true;
  emit('upData')

  if (saveParam.ADD_DIVV === 'N') {
    fileUpload1.value.enableFileUploadButton(['btnFileUpload', 'btnDownLoad', 'btnDelete'])
    fileUpload2.value.enableFileUploadButton(['btnFileUpload', 'btnDownLoad', 'btnDelete'])
  }
}

const resetForm = () => {
  Object.keys(saveParam).forEach(key => {
    saveParam[key] = ''
  })
}

const closePopup = () => {
  // debugger
  // if(!saveParam.REG_FILE_ID) {
  //   Message.warn('파일을 첨부해주세요.');  
  //   return false;
  // }

  // if(!saveParam.IRR_FILE_ID) {
  //   Message.warn('파일을 첨부해주세요.');  
  //   return false;
  // }
  // console.log("valYN", valYN.value)
  // console.log("fileCount.value", fileCount.value)
  // console.log("fileCount2.value", fileCount2.value)
  // console.log("saveParam.DIV", saveParam.DIV)
  // console.log("saveParam.REG_DT", saveParam.REG_DT)

  // 추가팝업
  // if (saveParam.REG_DT && fileCount.value === 0) {
  //   Message.warn('첨부파일은 필수입니다.');
  //   return;
  // }
  // if (saveParam.IRR_DT && fileCount2.value === 0) {
  //   Message.warn('첨부파일은 필수입니다.');
  //   return;
  // }

  // // 변경이력
  // if (saveParam.DIV === 'N' && saveParam.REG_DT && fileCount.value === 0) {
  //   Message.warn('첨부파일은 필수입니다.');
  //   return;
  // }

  // if (saveParam.DIV === 'N' && saveParam.IRR_DT && fileCount2.value === 0) {
  //   Message.warn('첨부파일은 필수입니다.');
  //   return;
  // }

    dialog.value = false
    resetForm()


}

const uploaded1 = (val) => {
  // valYN.value = "Y"
  // console.log('val', val)
  if (!val?.fileId) {
    Message.warn('파일 업로드에 실패했습니다.');
    return;
  }

  

  saveParam.REG_FILE_ID = val.fileId;
  emit('upData')
}

// IUPLOAD 컴포넌트에서 파일 삭제시에도 val에 파일아이디가 담겨옴 ( db에 삭제는 됨 )
// 그래서 length를 받아와서 0이면 빈값으로 저장
const onDataLength1 = (length) => {
  fileCount.value = length;
  // console.log("fileCount.value ", fileCount.value ) 
  // if (length === 0) {
  //   saveParam.REG_FILE_ID = ''
  // }
}

const uploaded2 = (val) => {
  // console.log('val', val)

  if (!val?.fileId) {
    Message.warn('파일 업로드에 실패했습니다.');
    return;
  }

  saveParam.IRR_FILE_ID = val.fileId; 
  emit('upData')
}

// IUPLOAD 컴포넌트에서 파일 삭제시에도 val에 파일아이디가 담겨옴 ( db에 삭제는 됨 )
// 그래서 length를 받아와서 0이면 빈값으로 저장
const onDataLength2 = (length) => {
  fileCount2.value = length;
  // console.log("fileCount.value2 ", fileCount2.value ) 
  // console.log("length2", length)
  // if (length === 0) {
  //   saveParam.IRR_FILE_ID = ''
  // }
}

defineExpose({
  openPopup
})

onMounted(() => {
    initCodeList()
})

// IUPLOAD 컴포넌트에 setGuid
watch(() => saveParam.EVAL_TYPE, async (val) => {
  if (!val) return;

  await nextTick(); // 렌더링 완료 보장

  if (val === '0' && fileUpload1.value?.setGuid) {
    // console.log("saveParam.REG_FILE_ID", saveParam.REG_FILE_ID)
    fileUpload1.value.setGuid(saveParam.REG_FILE_ID);
    fileUpload1.value.onButtonsClick({ id: "btnSearch" }); 
    // searchParam.FILE_ID = fileUpload1.value.guid;
  } else if (val === '1' && fileUpload2.value?.setGuid) {
    // console.log("saveParam.IRR_FILE_ID", saveParam.IRR_FILE_ID)
    fileUpload2.value.setGuid(saveParam.IRR_FILE_ID);
    fileUpload2.value.onButtonsClick({ id: "btnSearch" }); 
    // searchParam.FILE_ID = fileUpload2.value.guid;
  }
});

</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="700"
    height="800"
  >
    <div class="title-bar" @mousedown="startDragging">
      <span>공정위험성평가</span>
    </div>
    <v-card class="pa-3 fill-height" style="background-color: white" rounded="0">
      <v-card-title class="pa-2 py-0">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="titleButton"
          :hiddenManuel="true"
          @click-button="onButtonsClick"
        >
      </IGridTitle>
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <v-container fluid class="searchArea fill-height pa-0">
          <VCol style="height: 100%;">
            <VCol class="pa-0 mb-4">
              <div class="d-flex mb-3">
                    <i-input
                      v-model="saveParam.BSNS_NM"
                      label-width="50px"
                      width="250px"
                      :label="$t('사업부')"
                      disabled
                    />
                    <i-input
                      v-model="saveParam.DEPT_NM"
                      label-width="50px"
                      width="250px"
                      :label="$t('부서')"
                      disabled
                    />
              </div>
              <div class="mb-3">
                <i-input
                      v-model="saveParam.PROCESS_NM"
                      label-width="50px"
                      width="500px"
                      :label="$t('공정설비')"
                      disabled
                    />
              </div>
            </VCol>
            
            <div class="mb-3">
              <i-select 
              :label="$t('구분')"
              labelWidth="50px"
              width="250px"
              v-model="saveParam.EVAL_TYPE"
              :items="codeList.EVAL_TYPE"
              item-value="COD"
              item-title="TXT"
              :disabled="true"
              readonly
              />
            </div>

            <div v-if="saveParam.EVAL_TYPE === '0'" class="d-flex flex-column">
              <div class="d-flex flex-wrap mb-3">
                <i-select 
                  :label="$t('기법')"
                  labelWidth="50px"
                  width="250px"
                  v-model="saveParam.REG_TECH"
                  :items="codeList.EVAL_TECH"
                  item-value="COD"
                  item-title="TXT"
                  required
                  :disabled="true"
                  readonly
                  />
  
                  <i-input
                    :label="$t('일자')"
                    labelWidth="50px"
                    type="date"
                    width="200px"
                    v-model="saveParam.REG_DT"
                    required
                    disabled
                    >
                  </i-input>
                  <!-- :disabled="saveParam.DIV === 'Y'" -->

                  <i-input
                  :label="$t('내용')"
                  labelWidth="50px"
                  type="text"
                  width="500px"
                  v-model="saveParam.REG_CONTENT"
                  class="mt-3 mb-3"
                  :disabled="true"
                  readonly
                >
                </i-input>

                  <i-input
                     :label="$t('비고')"
                     labelWidth="50px"
                     type="text"
                     width="500px"
                     v-model="saveParam.REMARK"
                     class="mb-3"
                    :disabled="true"
                    readonly
                   >
                   </i-input>
              </div>  

              <p v-if="saveParam.ADD_DIV === 'Y'" class="text-red">※ 내용 저장 후 파일을 업로드 하실 수 있습니다.</p>

                <div style="height: 320px;">
                  <IUpload_NoAuth
                  ref="fileUpload1"
                  @uploaded="uploaded1"
                  @dataLength="onDataLength1"
                    auto-upload
                    :guid2="saveParam.REG_FILE_ID"
                    :isVisibled="false"
                    :buttonList="['btnDownLoad']"
                    />
                    <!-- DIV는 서브그리드에서 열때 넘기는 구분자, ADD_DIV는 추가버튼으로 열때 넘기는 구분자 -->
                    <!-- 서브그리드에서 열면 최신이력(DIV = N)을 제외하고 업로드가 안보여야함 -->
                    <!-- 추가버튼으로 열면 저장전까진 업로드가 안보여야함 -->
                </div>
            </div>

            <div v-if="saveParam.EVAL_TYPE === '1' || saveParam.IRR_TYPE === '0'" class="d-flex flex-wrap">
                <i-select 
                :label="$t('기법')"
                labelWidth="50px"
                width="250px"
                v-model="saveParam.IRR_TECH"
                :items="codeList.EVAL_TECH"
                item-value="COD"
                item-title="TXT"
                required
                :disabled="true"
                  readonly
                />

                <i-input
                  :label="$t('일자')"
                  labelWidth="50px"
                  type="date"
                  width="200px"
                  v-model="saveParam.IRR_DT"
                  required
                  :disabled="true"
                  readonly
                >
                </i-input>

                <i-input
                  :label="$t('내용')"
                  labelWidth="50px"
                  type="text"
                  width="500px"
                  v-model="saveParam.IRR_CONTENT" 
                  class="mt-3 mb-3"
                  :disabled="true"
                  readonly
                >
                </i-input>

                <i-input
                  :label="$t('비고')"
                  labelWidth="50px"
                  type="text"
                  width="500px"
                  v-model="saveParam.REMARK"
                  class="mb-6"
                  :disabled="true"
                  readonly
                >
                </i-input>

                <p v-if="saveParam.ADD_DIV === 'Y'" class="text-red">※ 내용 저장 후 파일을 업로드 하실 수 있습니다.</p>

                <div style="width: 100%; height: 320px;">
                  <IUpload_NoAuth ref="fileUpload2" :guid2="saveParam.IRR_FILE_ID" @uploaded="uploaded2" @dataLength="onDataLength2" :isVisibled="false"/>
                </div>
            </div>
          </VCol> 
        </v-container>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style lang="scss" scoped>

</style>