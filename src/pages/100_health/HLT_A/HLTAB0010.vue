<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { useCommonStore } from '@hiway/stores/common'
import RealGrid from '@/components/RealGrid.vue'
import _ from 'lodash'
import HLTAB0010Tab01 from './HLTAB0010Tab01.vue'
import HLTAB0010Tab02 from './HLTAB0010Tab02.vue'
import HLTAB0010Popup01 from './HLTAB0010Poup01.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' //결재
import temp01 from './HLTAB0010TEMP.vue'
 
defineOptions({
  name: '100_health-HLT_A-HLTAB0010',
})

const commonStore = useCommonStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const grdMain = ref(null)
const t = useI18n().t //다국어
const menuTitle = ref(null)
const tab = ref('tab1')
const hLTAB0010Popup01 = ref(null)
const tab01 = ref(null)
const tab02 = ref(null)
const approvalPopup = ref(null)
const temp = ref(null)
const isCreateView = ref(false)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_CD: (userStore.userDiv === 'A' || userStore.deptCd === userStore.asgnCd) ? '' : userStore.asgnCd,
  YEAR: String(dayjs().get('year')),
  EVAL_GUBUN: 'A',
  STATUS : '',
  LANGUAGE: 'ko',
  SEQ: '0',
  MAX_SEQ: '0',
})

const codeList = reactive({
  LANGUAGE: [
    { COD: 'ko', TXT: '한국어' },
    { COD: 'en', TXT: '영어' },
    { COD: 'vi', TXT: '베트남어' },
    { COD: 'uz', TXT: '우즈베크어' },
    { COD: 'mn', TXT: '몽골어' },
    { COD: 'si', TXT: '싱할라어' },
    { COD: 'th', TXT: '태국어' },
    { COD: 'ru', TXT: '러시아어' },
    { COD: 'ja', TXT: '일본어' },
    { COD: 'zh', TXT: '중국어간체' },
    { COD: 'zh-TW', TXT: '중국어번체' },
    { COD: 'de', TXT: '독일어' },
    { COD: 'fr', TXT: '프랑스어' },
    { COD: 'ar', TXT: '아랍어' },
    { COD: 'id', TXT: '인도네시아어' },
    { COD: 'ne', TXT: '네팔어' },
    { COD: 'bn', TXT: '벵골어' },
    { COD: 'fil', TXT: '필리핀어' },
    { COD: 'hi', TXT: '힌디어' },
    { COD: 'kk', TXT: '카자흐어' },
    { COD: 'km', TXT: '크메르어' },
    { COD: 'ky', TXT: '키르기스어' },
    { COD: 'my', TXT: '미얀마(버마)어' },
    { COD: 'tr', TXT: '터키어' },
    { COD: 'tk', TXT: '투르크멘어' },
    { COD: 'uk', TXT: '우크라이나어' },
    { COD: 'ur', TXT: '우르드어' },
  ],
  BSNS_CD: [],
  DEPT_CD: [],
  COMBO_DEPT_CD: [],
  ASGN_CD: [],
  COMBO_ASGN_CD: [],
  EVAL_GUBUN: [
    {COD: 'A', TXT: '정기'},
    {COD: 'B', TXT: '수시'},
  ],
  STATUS: [
    {COD: 'A', TXT: '작성중'},
    {COD: 'B', TXT: '결재중'},
    {COD: 'C', TXT: '반려'},
    {COD: 'N', TXT: '미결'},
    {COD: 'Y', TXT: '결재완료'},
    {COD: 'Z', TXT: '취소'},
  ],
  GBN_NO: [
    {COD: 'A', TXT: '화학물질 노출'},
    {COD: 'B', TXT: '소음 노출'},
    {COD: 'C', TXT: '근골격계 부담 수준'},
  ]
})


//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { fieldName: 'GBN_NM', width: '100', dataType: 'text', editable: false, header: { text: t('위험구분') } },
    { fieldName: 'PROCESS_NM', width: '120', editable: false, styleName: 'left-column', dataType: 'text', header: { text: t('단위 공정(직무)') } },
    { fieldName: 'HARM_NM', width: '120', editable: false, styleName: 'left-column', dataType: 'text', header: { text: t('위험요인') } },
    { fieldName: 'RATIO_CATEGORY', width: '80', editable: false, dataType: 'text', header: { text: t('빈도') } },
    { fieldName: 'FINAL_SCORE', width: '80', editable: false, dataType: 'text', header: { text: t('강도') } },
    { fieldName: 'POINT', width: '80', editable: false, dataType: 'text', header: { text: t('점수') } },
    { fieldName: 'GUIDE', width: '80', editable: false, dataType: 'text', header: { text: t('감소대책') } },
    // 안보이는거
  ],
  columns : [],
})
grd1Props.columns = grd1Props.fields

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // if(useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes('HLTF001') || 
  //   userStore.authGrpCd.includes('GRP00372')) {
  //     isAdmin.value = true
  // }

  onButtonsClick({ id: 'btnSearch' })

  Promise.all([
    // 사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
    // 부서
    // 협력사
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_ASGN', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: '', ORGN_DIV: '', USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR.filter(item => item.ORGN_DIV == 'A')
    codeList.ASGN_CD = res[1].ORESULT_CUR.filter(item => item.ORGN_DIV == 'B')
    codeList.ASGN_CD.unshift({ ASGN_NM: '직영', ASGN_CD: '' })

    codeList.COMBO_DEPT_CD = codeList.DEPT_CD.filter(item => item.BSNS_CD == searchParams.BSNS_CD)
    codeList.COMBO_ASGN_CD = codeList.ASGN_CD.filter(item => item.DEPT_CD == searchParams.DEPT_CD)
    codeList.COMBO_ASGN_CD.unshift({ ASGN_NM: '직영', ASGN_CD: '' })
  })
})

const onButtonsClick = async (btn) => {
  isCreateView.value = false
  if (btn.id === 'btnNewRegular') {
    // 결재상신 상태 체크
    if(searchParams.STATUS == 'Y' || searchParams.STATUS == 'B') {
      Message.warn('결재상신 후에는 데이터 수정이 불가능합니다.')
      return
    }
    hLTAB0010Popup01.value.openPopup(searchParams)
  } else if (btn.id === 'btnSearch') {
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_MAX_SEQ', param: searchParams }).then(res => {
      searchParams.SEQ = res.ORESULT_CUR[0].SEQ
      searchParams.MAX_SEQ = res.ORESULT_CUR[0].SEQ
      tab01.value.getData(searchParams)
      tab02.value.getData()
    })
  } else if (btn.id === 'btnUpdate') {
    if(tab.value == 'tab1') {
      tab01.value.saveData()
    } else {
      tab02.value.saveData()
    } 
  } else if (btn.id === 'btnPrint') {
    // temp.value.openPopup()
    grdMain.value.getDataProvider().setRows(tab02.value.getDetail())
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: '보건 위험성 정기/수시 평가'
        + '.xlsx', // 저장될 파일 name
      documentTitle: { //제목
        message: '보건 위험성 정기/수시 평가',
        visible: true, 
        spaceTop: 1,
        spaceBottom: 0,
        height: 80,
        styleName: 'excelTitle', 
      },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: false, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    }) 
  } else if (btn.id === 'btnRevision') {
    isCreateView.value = true
    tab.value = 'tab1'
    tab01.value.initData()
  } else if (btn.id === 'btnReqApply') {
    // 결재상신 상태 체크
    if(searchParams.STATUS == 'Y' || searchParams.STATUS == 'B') {
      Message.warn('결재상신 후에는 데이터 수정이 불가능합니다.')
      return
    }

    // if(tab.value == 'tab1') {
    //   tab01.value.approve()
    // }
    let detailData = tab02.value.getDetail()
    
    if(detailData.filter(item => item.STATUS !== '2' && item.SEQ == '1').length >= 1) {
      return Message.warn('모든 위험구분, 공정에 대해 위험성보정이 완료되어야 합니다.')
    } else if (detailData.filter(item => item.SEQ == '1' && isEmpty(item.GUIDE)).length >= 1) {
      return Message.warn('모든 공정에 대해 감소대책이 작성되어야 합니다.')
    }
    // 데이터 가공
    for(let data of detailData) {
      data.BEF_CLASS = detailData.find(item => item.GBN_NO == data.GBN_NO && item.PROCESS_CD == data.PROCESS_CD && item.SEQ == '1').CLASSIFICATION_NM
      data.AFT_CLASS = detailData.find(item => item.GBN_NO == data.GBN_NO && item.PROCESS_CD == data.PROCESS_CD && item.SEQ == '2').CLASSIFICATION_NM
      data.ADJUST_CLASS = detailData.find(item => item.GBN_NO == data.GBN_NO && item.PROCESS_CD == data.PROCESS_CD && item.SEQ == '2').MAX_POINT
      data.GUIDE_NM = detailData.find(item => item.GBN_NO == data.GBN_NO && item.PROCESS_CD == data.PROCESS_CD && item.SEQ == '1').GUIDE
    }
    approve(detailData)
  }
}

const setInfo = (param) => {
  let result = ''
  result += 
  `<html xmlns:v="urn:schemas-microsoft-com:vml"
                  xmlns:o="urn:schemas-microsoft-com:office:office"
                  xmlns:x="urn:schemas-microsoft-com:office:excel"
                  xmlns="http://www.w3.org/TR/REC-html40">
                  <head>
                    <meta http-equiv=Content-Type content="text/html; charset=ks_c_5601-1987">
                  <style >
                    .table-preview {
                        width: 100%;
                        table-layout: fixed;
                        border-collapse: collapse;
                    }
                    .table_header_cell {
                      text-align: center; /* 가로 가운데 정렬 */
                      vertical-align: middle; /* 세로 가운데 정렬 */
                      border-collapse: collapse;
                      width: 100%;
                      height: 50px;
                      border-top : 3px solid black;
                      border-bottom : 1px solid black;
                      border-left : 1px solid black;
                      border-right : 1px solid black;
                      table-layout: fixed;
                    }
                    .table_content_cell {
                      text-align: center; /* 가로 가운데 정렬 */
                      vertical-align: middle; /* 세로 가운데 정렬 */
                      border-collapse: collapse;
                      width: 100%;
                      height: 50px;
                      border-top : 3px solid black;
                      border-bottom : 1px solid black;
                      border-left : 1px solid black;
                      border-right : 1px solid black;
                      table-layout: fixed;
                    }
                    
                    .left-align {
                      text-align: left;
                    }
                    .title-text {
                      background: #dcdce9;
                      font-weight: bold;
                      text-align: center;
                    }                

          </style>
        </head>
  <table class="table-preview">
  <thead>
  <tr>
  <th class="table_header_cell">위험 구분</th>
  <th class="table_header_cell">단위 공정</th>
  <th class="table_header_cell">주요 위험요인</th>
  <th class="table_header_cell">빈도</th>
  <th class="table_header_cell">강도</th>
  <th class="table_header_cell">보정 전 위험성단계</th>
  <th class="table_header_cell">위험성보정</th>
  <th class="table_header_cell">보정 후 위험성단계</th>
  <th class="table_header_cell">감소대책</th>
  </tr> 
  </thead>
  <tbody>`

  for(let p of param.filter(item => item.MAX_YN == 'Y')) {
    let gbnNm = codeList.GBN_NO.find(item => item.COD == p.GBN_NO).TXT
    result += 
    `<tr>
      <td class="table_content_cell">${gbnNm}</td>
      <td class="table_content_cell">${p.PROCESS_NM}</td>
      <td class="table_content_cell left-align">${p.HARM_NM}</td>
      <td class="table_content_cell">${p.RATIO_CATEGORY}</td>
      <td class="table_content_cell">${p.FINAL_SCORE}</td>
      <td class="table_content_cell">${p.BEF_CLASS}</td>
      <td class="table_content_cell">${p.ADJUST_CLASS}</td>
      <td class="table_content_cell">${p.AFT_CLASS}</td>
      <td class="table_content_cell left-align">${p.GUIDE_NM}</td>
    </tr>`
      
  }
  result += 
  `</tbody>
  </table>`
  return result
}

const approve = (param) => {

  // 접속한 계정이 협력사인지 체크
  // 결재시 분기처리
  // 직영   -> 결재상신 팝업을 통해서 결재
  // 협력사 -> 바로 결재완료 처리
  commonSearchApi({ queryId: 'HLTAB0010_SEARCH_VEND', param: searchParams }).then(res => {
      if(res.ORESULT_CUR[0].COUNT > 0) {
        commonSearchApi({ queryId: 'HLTAB0010_SAVE_10', param: searchParams }).then(res => {          
          Message.success('결재완료처리 하였습니다.')
          tabRefresh()
        })
      }else {
        approvalPopup.value.openPopup({
          CLSS_ID: 'HLTAB0010',
          TITLE: '보건 위험성 평가 결재신청',
          CMPNY_DIV: searchParams.CMPNY_DIV,
          DATA_KEY:
            searchParams.CMPNY_DIV +
            ';' +
            searchParams.BSNS_CD +
            ';' +
            searchParams.DEPT_CD +
            ';' +
            searchParams.ASGN_CD +
            ';' +
            searchParams.SEQ,
          //REPORT: '결재 내용?',
          REPORT: setInfo(param),
          MODE: '3',
          FORM_ID: '421',
          CLRLINE: 'CLR_15',    
        })
      }
  })
}

/* ------------ 결재 후 결재라인 가져오기 저장 ------------ */
const approvalClrLine = val => {

  commonExecuteApi
    ({ 
        queryId : 'HLTAB0010_SAVE_08'
      , list: [{
        CMPNY_DIV: searchParams.CMPNY_DIV, 
        BSNS_CD: searchParams.BSNS_CD,
        DEPT_CD: searchParams.DEPT_CD,
        ASGN_CD: searchParams.ASGN_CD,
        YEAR: searchParams.YEAR,
        SEQ: searchParams.SEQ,
        APPROVAL_STATUS: 'B', 
        APPROVAL_KEY: val.appkey
      }]
    }).then(res=>{
      searchParams.STATUS = 'B'
      tabRefresh()
    })
}

const btnSetting = async () => {  
  menuTitle.value.disableBtn('btnRevision', false)
  menuTitle.value.disableBtn('btnReqApply', false)
  menuTitle.value.disableBtn('btnUpdate', false)

  // 신규등록시
  if(isCreateView.value) {
    menuTitle.value.disableBtn('btnReqApply', true)
    menuTitle.value.disableBtn('btnUpdate', false)
    return
  }

  // 개정이력이 없을시
  if(!tab01.value.getGridCount() > 0) {
    menuTitle.value.disableBtn('btnReqApply', true)
    menuTitle.value.disableBtn('btnUpdate', false)
    return
  }

  // 개정이력이 있을시에는 결재완료를 해야 새로운 개정을 할 수 있음
  if(searchParams.STATUS != 'Y') {
    menuTitle.value.disableBtn('btnRevision', true)
  }else {
    menuTitle.value.disableBtn('btnRevision', false)
  }


  // 최근 데이터가 아닐때는 신규(수시평가),결재,저장 비활성화
  if(searchParams.SEQ != searchParams.MAX_SEQ) {
    menuTitle.value.disableBtn('btnReqApply', true)
    menuTitle.value.disableBtn('btnUpdate', true)
  }

  // 결재상신 후 신규(수시평가),결재,저장 비활성화
  if(searchParams.STATUS == 'Y' || searchParams.STATUS == 'B') {
    menuTitle.value.disableBtn('btnReqApply', true)
    menuTitle.value.disableBtn('btnUpdate', true)
  }
  
}

const subData = () => {
  tab02.value.getData()
}

// 1,2 탭 전부 새로 조회
const tabRefresh = () => {
  tab01.value.getData(searchParams)
  tab02.value.getData()
}

watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  // getData()
  searchParams.ASGN_CD = ''
  searchParams.DEPT_CD = ''
  codeList.COMBO_DEPT_CD = codeList.DEPT_CD.filter(item => item.BSNS_CD == newValue)
})

watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  // getData()
  searchParams.ASGN_CD = ''
  codeList.COMBO_ASGN_CD = codeList.ASGN_CD.filter(item => item.DEPT_CD == newValue)
  codeList.COMBO_ASGN_CD.unshift({ ASGN_NM: '직영', ASGN_CD: '' })
})

watch(() => searchParams.LANGUAGE, (newValue, oldValue) => {
  // tab01.value.transData()
  // tab02.value.transData()
})

</script>

<template>
  <div>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t(useLogsStore().menuId)"
          :button-list="['btnRevision', 'btnSearch', 'btnUpdate', 'btnReqApply', 'btnPrint']"
          @click-button="onButtonsClick"
          :use-permission="false"
        >
        <template #editors>
          <div class="d-flex flex-grow-1 justify-end">
            <i-select 
              v-model="searchParams.LANGUAGE"
              :items="codeList.LANGUAGE"
              item-value="COD"
              item-title="TXT" 
              width="130px" 
              style="height:24px;"
            />
          </div>
        </template>
        </IMenuTitle>
        <v-sheet class="searchArea">
            <div class="d-flex">
              <i-select 
                v-model="searchParams.BSNS_CD"
                :label="$t('사업부')" 
                label-width="50px" 
                width="200px" 
                :items="codeList.BSNS_CD"
                item-value="BSNS_CD"
                item-title="BSNS_NM" 
              />
              <i-select 
                v-model="searchParams.DEPT_CD"
                :label="$t('부서')" 
                label-width="50px" 
                width="200px" 
                :items="codeList.COMBO_DEPT_CD"
                item-value="DEPT_CD"
                item-title="ASGN_NM" 
              />
              <i-select 
                v-model="searchParams.ASGN_CD"
                :label="$t('협력사')" 
                label-width="50px" 
                width="200px"
                :items="codeList.COMBO_ASGN_CD"
                item-value="ASGN_CD"
                item-title="ASGN_NM"
                :readonly="isEmpty(searchParams.DEPT_CD)"
              />
              <i-input 
                v-model="searchParams.YEAR"
                :label="$t('기준년도')" 
                label-width="50px" 
                width="200px"
                type="number"
              />
             
            </div>
          </v-sheet>
          <v-sheet>
            <v-tabs v-model="tab" class="mb-2">
              <v-tab value="tab1">평가 정보</v-tab>
              <v-tab value="tab2" :disabled="isCreateView">세부내용</v-tab>
            </v-tabs>
          </v-sheet>
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <RealGrid
            ref="grdMain"
            style="display:none;"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
          />
          <v-sheet>
            <v-window v-model="tab">
              <v-window-item eager value="tab1">
                <v-sheet>
                  <HLTAB0010Tab01
                    ref="tab01"
                    :searchParams="searchParams"
                    @btnSetting="btnSetting"
                    @subData="subData"
                    @isCreateView:update="val => isCreateView = val"
                  ></HLTAB0010Tab01>
                </v-sheet>
              </v-window-item>
              <v-window-item eager value="tab2">
                <v-sheet>
                  <HLTAB0010Tab02
                    ref="tab02"
                    :searchParams="searchParams"
                    @propOnButtonsClick="onButtonsClick"
                  ></HLTAB0010Tab02>
                </v-sheet>
              </v-window-item>
            </v-window>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <HLTAB0010Popup01 ref="hLTAB0010Popup01" @after-search="tabRefresh()"></HLTAB0010Popup01>
    <ApprovalPopup ref="approvalPopup" @approvalClrLine="approvalClrLine"/>
    <temp01 ref="temp"></temp01>
  </div>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 185px);
  overflow-y: auto;
  > div {
    min-height: 400px;
  }
}

// .content-area-tab {
//   position: relative;
//   height: calc(100vh - 220px);
//   overflow-y: auto;
//   > div {
//     min-height: 600px;
//   }
// }
</style>
