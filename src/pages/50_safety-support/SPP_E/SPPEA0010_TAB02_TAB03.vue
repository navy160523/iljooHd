<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import RealGrid from "@/components/RealGrid.vue"
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from "dayjs"
import { commonSearchApi, commonExecuteApi, commonLogExecuteApi, commonSendSMS } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from '@hiway/utils/notify'
import { commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import PdfViewPopup from "@/pages/50_safety-support/SPP_E/PdfViewPopup.vue"
import ViolationPopup from "@/pages/50_safety-support/SPP_E/ViolationPopup.vue"
import SPPEA0010EmpPopup from "@/pages/50_safety-support/SPP_E/SPPEA0010EmpPopup.vue"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const menuTitle = ref(null)
const uploadFile = ref(null)
const pdfViewPopup = ref(null)
const violationPopup = ref(null)
const empPopup = ref(null)
 
/* 조회 데이터 */
const props = defineProps({
  searchParams: {
    Type: Object,
    default: {},
  },
  codeList: {
    Type: Object,
    default: {}
  }
})

/* 저장, 삭제 데이터 */
const saveParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  BIKE_REG_NO: '',
  EMP_NM: '',
  EMP_NO: '',
  JOB_TIT_NM: '',
  HP_NO: '',
  TEL_NO: '',
  ASGN_NM: '',
  EDU_DATE: '',
  BIKE_NO: '',
  CAPA: '',
  SCAN_NM: '',
  VND_NAME: '',
  EDU_FILE_NM: '',
  ERASE_DESC: '',
  USE_DIV: '',
  IO_DIV: '',
  EDU_FILE_ID: '',
  SCAN_ID: '',
  VIOCNT: '',
  OLD_REG_NO: '',
  USER_ID: userStore.userId,
  SCAN_ID_YN: '',
  EDU_FILE_ID_YN: '',
  MENH_ID: '',
  BOHM_ID: '',
  DUNGRK_ID: '',
  VIO_CNT: null,
  REJECT_DESC: '',
  SCHEDULE_ID: '',
  ERASE_DIV_NM: '',
  LOCAL_EMP_NM: '',
  LOCAL_EMP_NO: '',
})

/* 코드 리스트 */
const codeList = reactive({
  CMPNY_List: [],      // 회사구분
  BSNSList: [],        // 사업부
  DEPTList: [{ ASGN_SHRT_NM:'전체', DEPT_CD: '' }],      // 부서
  IO_DIVList: [                                      // 소속구분
    { label: 'ALL', value: '' }, 
    { label: '직영', value: 'A' }, 
    { label: '사내협력사', value: 'B' }, 
    { label: '사외협력사', value: 'C' }, 
  ],
  IO_DIVList2: [                                      // 그리드내 소속구분
    { label: 'ALL', value: '' }, 
    { label: '직영', value: 'A' }, 
    { label: '협력사', value: 'B' }, 
    { label: '사외', value: 'C' }, 
  ],
  USE_DIVList: [
    { label: '개인', value: 'P' }, 
    { label: '업무용', value: '2' }, 
  ],
  ERASE_DIVList: [
    { label: '퇴사', value: 'A' }, 
    { label: '누적위반', value: 'B' }, 
    { label: '중대위반', value: 'C' }, 
    { label: '삭제', value: 'D' }, 
  ],
  STATUS_LIST: []
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable:false }  },
  keys : [],
  fields : [ 
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, width: '400', styleName: 'left-column'},
    { fieldName: 'VND_NAME', dataType: 'text', header: { text: t('사외협력사명') }, width: '180', styleName: 'left-column'},
    { fieldName: 'IO_DIV', dataType: 'text', header: { text: t('소속구분') },lookupDisplay: true, lookupData: codeList.IO_DIVList2},
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }},
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }},
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름') }},
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('사내연락처') }, width: '150', styleName: 'left-column'},
    { fieldName: 'ERASE_DIV', dataType: 'text', header: { text: t('말소사유') }, width: '150',lookupDisplay: true, lookupData: props.codeList.ERASE_DIVList},
    { fieldName: 'ERASE_DATE',  dataType: 'date', datetimeFormat: 'yyyy-MM-dd', header: { text: t('말소일자') }},
    { fieldName: 'BIKE_REG_NO', dataType: 'text', header: { text: t('등록번호(신)') }, width: '150'},
    { fieldName: 'OLD_REG_NO', dataType: 'text', header: { text: t('등록번호(구)') }, width: '150'},
    { fieldName: 'BIKE_NO', dataType: 'text', header: { text: t('차량번호') }, width: '150'},
    { fieldName: 'VIOCNT', dataType: 'text', header: { text: t('위반횟수') }, width: '100', 
      renderer: {
          type: "html",
          callback: function (grid, cell, w, h) {
            let result = ""

            if (cell && cell.value) {
              result = `<div class="d-flex justify-space-between">
                <div class="h-auto">
                  ${cell.value}
                </div>
                <div>
                  <span class="mdi mdi-magnify cursor-pointer"></span>
                </div>
              </div>`
            }

            return result
          },
        },  
      // button: 'popup', buttonVisibility: 'always' 
    },
    { fieldName: 'ERASER_NM', dataType: 'text', header: { text: t('말소처리자') }, styleName: 'left-column', width: '150'},

    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육이수일') }, visible: false},
    { fieldName: 'CAPA', dataType: 'text', header: { text: t('배기량') },visible: false },
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('진행상태') },visible: false},
    { fieldName: 'USE_DIV_NM', dataType: 'text', header: { text: t('용도구분') }, visible: false},
    { fieldName: 'REJECT_DESC', dataType: 'text', header: { text: t('반려/불가사유') }, visible: false},
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false },
    { fieldName: 'HP_NO', dataType: 'text', header: { text: t('HP_NO') }, visible: false },
    { fieldName: 'SCAN_NM', dataType: 'text', header: { text: t('SCAN_NM') }, visible: false },
    { fieldName: 'EDU_FILE_NM', dataType: 'text', header: { text: t('EDU_FILE_NM') }, visible: false },
    { fieldName: 'ERASE_DESC', dataType: 'text', header: { text: t('ERASE_DESC') }, visible: false },
    { fieldName: 'USE_DIV', dataType: 'text', header: { text: t('USE_DIV') }, visible: false },
    { fieldName: 'EDU_FILE_ID', dataType: 'text', header: { text: t('EDU_FILE_ID') }, visible: false },         // 교육이수자료
    { fieldName: 'SCAN_ID', dataType: 'text', header: { text: t('SCAN_ID') }, visible: false },                 // 책임보험서류
    { fieldName: 'SCAN_ID_YN', dataType: 'text', header: { text: t('SCAN_ID_YN') }, visible: false },
    { fieldName: 'EDU_FILE_ID_YN', dataType: 'text', header: { text: t('EDU_FILE_ID_YN') }, visible: false },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ') }, visible: false },
    { fieldName: 'APP_DATE', dataType: 'text', header: { text: t('APP_DATE') }, visible: false },
    { fieldName: 'VIO_CNT', dataType: 'text', header: { text: t('VIO_CNT') }, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, visible: false },
    { fieldName: 'ERASE_DIV_NM', dataType: 'text', header: { text: t('ERASE_DIV_NM') }, visible: false },
  ],
  columns : [],
})
grdMainProps.columns = grdMainProps.fields

const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'empPopup'){
    empPopup.value.openPopup()
  }else if(btn.id === 'transData'){
    if(!saveParams.EMP_NM){
      return
    }else {
      if(saveParams.EMP_NM !== saveParams.LOCAL_EMP_NM){
        return Message.err(t('말소된 운전자와 이관 대상 운전자의 이름이 다릅니다. 이관 대상을 확인하세요.'))
      }

      let result = await vm.$swal({ 
        title: t('오토바이 등록 정보를 이관하시겠습니까?'), 
        showCancelButton: true,
      })
      if(!result.isConfirmed){
        return
      }else {
        commonExecuteApi({ queryId : 'SPPEA0010_TAB02_SAVE_07', list: [saveParams] }).then(() => {
          Message.success(t('오토바이 등록 정보가 이관 되었습니다.'))
          onButtonsClick({id: 'btnSearch'})
        })
      }
    }
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'SPPEA0010_TAB02_SEARCH_05', param: props.searchParams })
}

const afterSearch = async res => {
  for(let i in saveParams){
    saveParams[i] = ''
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  if(res.ORESULT_CUR.length > 0){ 
    onCellClicked(null, {cellType: 'data' , dataRow: '0'})
  }

  let afterparams = {
    userStore: userStore,
    params: props.searchParams,
    mgs: '[오토바이 등록(부서/협력사용)] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', //사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }

  // 로그기록
  commonLogExecuteApi(afterparams)
}

const onCellClicked = async (grid, clickData) => {
  if(clickData.cellType === 'data'){
    let data = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    for(let i in data){
      if(i === 'EDU_DATE' || i === 'APP_DATE'){
        saveParams[i] = await data[i] ? dayjs(data[i]).format('YYYY-MM-DD') : null
      }else {
        saveParams[i] = data[i] ? data[i] : ''
      }
    }
  }
}

const popupOpen = (grid, index, clickData) => {
  if(clickData.target.nodeName === 'SPAN'){
    let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    if(data.VIOCNT > 0){
      violationPopup.value.openPopup(data)
    }
  }
}

const selected = val => {
  saveParams.LOCAL_EMP_NM = val.EMP_NM
  saveParams.LOCAL_EMP_NO = val.EMP_NO
}

/* PDF파일 뷰어 팝업 */
const viewPopup = e => {
  if(e){
    let param = {
      CMPNY_DIV: saveParams.CMPNY_DIV,
      FILE_ID: saveParams.SCAN_ID
    }
    pdfViewPopup.value.openPopup(param)
  }
}

onMounted(() => {
  onButtonsClick({id: 'btnSearch'})
})

defineExpose({
  onButtonsClick,
})
</script>

<template>
  <div class="d-flex flex-column fill-height">
    <v-sheet class="h-auto">
      <RealGrid
        ref="grdMain"
        :grid-view-option="grdMainProps.gridViewOption"
        :keys="grdMainProps.keys" 
        :fields="grdMainProps.fields"
        :columns="grdMainProps.columns"
        @onCellClicked="onCellClicked"
        @onCellItemClicked="popupOpen"
      />
    </v-sheet>
    <v-sheet class="mt-4">
      <IGridTitle
        ref="menuTitle"
        :title="$t('등록 상세 내역')"
        :button-list="[]"
        @click-button="onButtonsClick"
      />
      <div class="searchArea flex-column fill-height mb-1 pa-3">
        <div class="flex-column">
          <div class="d-flex">
            <div class="flex-column">
              <div class="d-flex">
                <div class="d-flex align-center" style="width: 300px;">
                  <div class="formLabelText mr-6">
                    {{ $t('용도구분') }}
                  </div>
                  <VRadioGroup
                    v-model="saveParams.USE_DIV"
                    inline
                    class="ml-4 mr-4"
                  >
                    <VRadio
                      v-for="(item , i) in codeList.USE_DIVList"
                      :key="i"
                      :value="item.value"
                      :label="item.label"
                      :disabled="true"
                    />
                  </VRadioGroup>
                </div>
                <div class="d-flex align-center ml-6 mr-6">
                  <VCheckbox
                    v-model="saveParams.IO_DIV"
                    true-value="C" false-value="N"
                    :disabled="true"
                  />
                  <div class="formLabelText ml-2">
                    {{ $t('사외협력사') }}
                  </div>
                </div>
                <i-input 
                  v-model="saveParams.BIKE_REG_NO"
                  :label="$t('등록번호(신)')"
                  label-width="80px" 
                  width="300px"
                  :disabled="true"
                />
                <i-input 
                  v-model="saveParams.OLD_REG_NO"
                  :label="$t('등록번호(구)')"
                  label-width="80px" 
                  width="300px"
                  :disabled="true"
                />
              </div>
              <div class="d-flex pt-1">
                <i-input
                  v-model="saveParams.EMP_NM"
                  :label="$t('운전자')"
                  label-width="80px"
                  width="300px"
                  :disabled="true"
                />
                <i-input
                  v-model="saveParams.EMP_NO"
                  :label="$t('사번')"
                  label-width="35px" 
                  width="200px"
                  :disabled="true"
                />
                <i-input 
                  v-model="saveParams.JOB_TIT_NM"
                  :label="$t('직위')"
                  label-width="35px" 
                  width="200px"
                  :disabled="true"
                />
                <i-input 
                  v-model="saveParams.HP_NO"
                  :label="$t('휴대폰')"
                  label-width="80px" 
                  width="300px"
                  :disabled="true"
                />
              </div>
              <div class="d-flex pt-1">
                <i-input 
                  v-model="saveParams.ASGN_NM"
                  :label="$t('소속조직')"
                  label-width="80px"
                  width="740px"
                  :disabled="true"
                />
                <i-input 
                  v-model="saveParams.TEL_NO"
                  :label="$t('사내연락처')"
                  label-width="80px" 
                  width="300px"
                  :disabled="true"
                />
              </div>
            </div>
            <div class="flex-column pa-1 bg-white" style="border: 1px solid gray;">
              <div class="pb-2 pl-2">
                <div class="formLabelText">
                  전직자 이관
                </div>
              </div>
              <div class="pt-1 pl-2">
                <i-input 
                  v-model="saveParams.LOCAL_EMP_NM"
                  :label="$t('운전자')"
                  label-width="50px" 
                  width="250px"
                  append-inner-icon="mdi-magnify" 
                  @click:appendInner="onButtonsClick({id: 'empPopup'})"
                />
              </div>
              <div class="pt-1 pl-2" style="text-align: center;">
                <div >
                  <v-btn @click="onButtonsClick({id: 'transData'})">말소 취소 및 이관</v-btn>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.BIKE_NO"
            :label="$t('차량번호')"
            label-width="80px" 
            width="400px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.CAPA"
            :label="$t('배기량')"
            label-width="50px" 
            width="200px"
            maxlength="4"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.SCAN_NM"
            :label="$t('책임보험서류')"
            label-width="80px"
            width="680px"
            :disabled="true"
            class="mr-0"
          />
          <div class="d-flex align-center">
            <v-btn @click="viewPopup(saveParams.SCAN_NM)">보기</v-btn>
          </div>
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.VND_NAME"
            :label="$t('사외협력사명')"
            label-width="80px" 
            width="620px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.EDU_FILE_NM"
            :label="$t('교육이수자료')"
            label-width="80px" 
            width="680px"
            readonly
            class="mr-0"
            :disabled="true"
          />
          <div class="d-flex align-center">
            <v-btn @click="viewPopup(saveParams.EDU_FILE_ID)">보기</v-btn>
          </div>
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.ERASE_DIV_NM"
            :label="$t('말소사유')"
            label-width="80px" 
            width="1370px"
            :disabled="true"
            class="mr-0"
          />
        </div>
      </div>
    </v-sheet>
  <!-- PDF VIEW 팝업 -->
  <PdfViewPopup ref="pdfViewPopup" />
  <!-- 위반 횟수 팝업 -->
  <ViolationPopup ref="violationPopup" />

  <!-- 사원 조회 팝업 -->
  <SPPEA0010EmpPopup ref="empPopup" @selected="selected" />
  </div>
</template>
<style scoped lang="scss">
.formLabelText{
  font-weight: bold;
}
</style>
