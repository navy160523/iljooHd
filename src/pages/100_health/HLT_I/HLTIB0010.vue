<!-- 
  화면명 : 유해요인조사 결과/개선 등록
  화면개요 : 유해요인에 대한 조사 및 개선결과를 등록한다.
  작성자: 일주지앤에스 SI1팀 김현재 선임
-->
<script setup>
import { reactive, onMounted, getCurrentInstance, readonly } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import HLTIB0010Popup01 from './HLTIB0010Popup01.vue'
import HLTIB0010Popup02 from './HLTIB0010Popup02.vue'
import HLTIB0010Popup03 from './HLTIB0010Popup03.vue'
import HLTIB0010Popup04 from './HLTIB0010Popup04.vue'
import HLTIB0010Popup05 from './HLTIB0010Popup05.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' //결재
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import _ from 'lodash'
defineOptions({
  name: '100_health-HLT_I-HLTIB0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const logsStore = useLogsStore()
const hLTIB0010Popup01 = ref(null)
const hLTIB0010Popup02 = ref(null)
const hLTIB0010Popup03 = ref(null)
const hLTIB0010Popup04 = ref(null)
const hLTIB0010Popup05 = ref(null)
const approvalPopup = ref(null)
const isAdmin = ref(false) //화면에 대한 권한이 있는지 확인하는 변수(관리자 체크)
const hempYn = ref(false) //HEMP운영조직에 등록되어있는지 확인하는 변수
const nomalUser = ref(false) //관리자도아니고 HEMP운영조직에 등록되어있지 않으면 일반사용자

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  YEAR: new Date().getFullYear(), //기준년도
  ES_DIV: '', //조사구분
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  VEND_CD: userStore.userDiv === 'A' ? 'N' : userStore.asgnCd, //협력사
  USER_DIV: userStore.userDiv,
})

const readOnlyValue = reactive({
  DEPT_CD: true,
  BSNS_CD: true,
  VEND_CD: true,
})

const codeList = reactive({
  ES_DIV: [], //조사구분
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
  GRID_BSNS_CD: [], //사업부(그리드)
  GRID_DEPT_CD: [], //부서(그리드)
  VEND_CD: [], //협력사
  ES_DIV: [], //조사구분
  SAGO_BODY_CD: [], //신체부위
  WRK_STUS_EQP: [], //설비
  WRK_STUS_VOL: [], //작업량
  WRK_STUS_SPD: [], //작업속도
  WRK_STUS_INC: [], //작업내용
})

const initCodeList = () => {
  Promise.all([
    //조사구분(평가분류)
    getCodeList('HHII620'),
    //사업부조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: 'Y' },
    }),
    //협력사조회
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, DEPT_CD: searchParam.DEPT_CD },
    }),
    //조사구분 조회
    getCodeList('HHII620'),
    //신체부위 조회
    getCodeList('HHII820D'),
    //설비
    getCodeList('HHII622A'),
    //작업량
    getCodeList('HHII622B'),
    //작업속도
    getCodeList('HHII622C'),
    //업무변화
    getCodeList('HHII622D'),
    commonSearchApi({ queryId: 'HLTFA0020_SEARCH_DEPT', param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'Y' } }),
  ]).then((res) => {
    codeList.ES_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.GRID_BSNS_CD = _.cloneDeep(res[1].ORESULT_CUR)
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.VEND_CD = res[3].ORESULT_CUR
    codeList.ES_DIV = res[4].ORESULT_CUR
    codeList.SAGO_BODY_CD = res[5].ORESULT_CUR
    codeList.WRK_STUS_EQP = res[6].ORESULT_CUR
    codeList.WRK_STUS_VOL = res[7].ORESULT_CUR
    codeList.WRK_STUS_SPD = res[8].ORESULT_CUR
    codeList.WRK_STUS_INC = res[9].ORESULT_CUR
    codeList.GRID_DEPT_CD = res[10].ORESULT_CUR
    codeList.ES_DIV.unshift({ TXT: '전체', COD: '' })
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.VEND_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    grdMain.value.setBindingColumn('ES_DIV', codeList.ES_DIV, 'COD', 'TXT')
    grdMain.value.setBindingColumn('WRK_STUS_EQP', codeList.WRK_STUS_EQP, 'COD', 'TXT')
    grdMain.value.setBindingColumn('WRK_STUS_VOL', codeList.WRK_STUS_VOL, 'COD', 'TXT')
    grdMain.value.setBindingColumn('WRK_STUS_SPD', codeList.WRK_STUS_SPD, 'COD', 'TXT')
    grdMain.value.setBindingColumn('WRK_STUS_INC', codeList.WRK_STUS_INC, 'COD', 'TXT')
    grdMain.value.setBindingColumn('SAGO_BODY_CD', codeList.SAGO_BODY_CD, 'COD', 'TXT')
    grdMain.value.setBindingColumn('BSNS_CD', codeList.GRID_BSNS_CD, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('DEPT_CD', codeList.GRID_DEPT_CD, 'DEPT_CD', 'DEPT_NM')
    if (userStore.userDiv === 'A') {
      codeList.VEND_CD.unshift({ ASGN_NM: '선택안함', ASGN_CD: 'N' })
    }
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      width: '100',
      header: { text: t('사업부') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      //추가되었을때만 수정가능하도록
      styleCallback: function (grid, dataCell) {
        //let ret = { editable: true, styleName: 'editable_column', enabled: true }
        let ret = {}
        if (isAdmin.value) {
          ret.editor = {
            type: 'dropdown',
            editable: true,
            styleName: 'editable_column',
            enabled: true,
          }
          if (dataCell.item.rowState == 'created') {
            ret.editable = true
            ret.enabled = true
            ret.style = { background: '#eff8fd' }
          } else {
            ret.editable = false
            ret.enabled = false
            ret.style = { background: '#FFFFFF' }
          }
        } else {
          ret.editable = false
        }

        return ret
      },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('부서/협력사명') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      //추가되었을때만 수정가능하도록
      styleCallback: function (grid, dataCell) {
        //var ret = { editable: true, styleName: 'editable_column', enabled: true }
        let ret = {}
        //관리자일때만 수정가능
        if (isAdmin.value) {
          ret.editor = {
            type: 'dropdown',
            editable: true,
            styleName: 'editable_column',
            enabled: true,
          }
          if (dataCell.item.rowState == 'created') {
            ret.editable = true
            ret.enabled = true
            ret.style = { background: '#eff8fd' }
          } else {
            ret.editable = false
            ret.enabled = false
            ret.style = { background: '#FFFFFF' }
          }
        } else {
          ret.editable = false
        }

        return ret
      },
    },
    {
      fieldName: 'WORK_STANDARD_NO',
      dataType: 'text',
      width: '250',
      editable: false,
      header: { text: t('작업표준번호') },
      //추가되었을때만 수정가능하도록
      styleCallback: function (grid, dataCell) {
        var ret = { editable: true, styleName: 'editable_column', enabled: true }

        if (dataCell.item.rowState == 'created') {
          ret.editable = true
          ret.enabled = true
          ret.style = { background: '#eff8fd' }
        } else {
          ret.editable = false
          ret.enabled = false
          ret.style = { background: '#FFFFFF' }
        }

        return ret
      },
    },
    {
      fieldName: 'WORK_STANDARD_NM',
      dataType: 'text',
      width: '250',
      editable: false,
      header: { text: t('작업표준명') },
      //추가되었을때만 수정가능하도록
      styleCallback: function (grid, dataCell) {
        //var ret = { editable: true, styleName: 'editable_column', enabled: true }
        var ret = {}
        if (dataCell.item.rowState == 'created') {
          ret.editable = true
          ret.enabled = true
          ret.styleName = 'editable_column'
          ret.style = { background: '#eff8fd' }
        } else {
          ret.editable = false
          ret.enabled = false
          ret.styleName = 'left-column'
          ret.style = { background: '#FFFFFF' }
        }

        return ret
      },
    },
    {
      fieldName: 'GROUP_NO',
      dataType: 'text',
      width: '250',
      editable: false,
      header: { text: t('그룹작업 표준번호') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'GROUP_YN')
          if (value == 'Y') {
            return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
            <div style="white-space: pre-line;">${(cell.value ?? '').replaceAll(',', '\n')}</div>
           </div>
          `
          } else {
            return ''
          }
        },
      },
    },
    {
      fieldName: 'BEFORE_DATE',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('조사이력') },
      styleCallback: function (grid, dataCell) {
        let ret = {}
        const iconSize = 15

        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function (grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }

        return ret
      },
    },
    {
      fieldName: 'ES_DIV',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('조사구분') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'SAGO_EMP_NM',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('대상자') },
    },
    {
      fieldName: 'SAGO_DUTY_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직종') },
    },
    {
      fieldName: 'SAGO_BODY_CD',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('신체부위') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'ES_RESIST',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('조사등록') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          let ES_SEQ = grid.getValue(cell.index.itemIndex, 'ES_SEQ') //순번
          let ES_STUS_COD = grid.getValue(cell.index.itemIndex, 'ES_STUS_COD') //진행상태코드
          let CLOSE_DATE = grid.getValue(cell.index.itemIndex, 'CLOSE_DATE') //완료처리일

          if (ES_SEQ && ES_STUS_COD === '0' && !CLOSE_DATE) {
            let btnValue = '등록중'
            let btnBackColor = '#81c147'
            var str = `<button
              class="v-btn"
              style="color: #fff; background: ${btnBackColor}; padding:6px"
            >${btnValue}</button>`
            return str
          } else if (ES_SEQ && CLOSE_DATE) {
            let btnValue = '등록완료'
            let btnBackColor = '#0617D7'
            var str = `<button
              class="v-btn"
              style="color: #fff; background: ${btnBackColor}; padding:6px"
            >${btnValue}</button>`
            return str
          } else {
            let btnValue = '미등록'
            let btnBackColor = '#FF0000'
            var str = `<button
              class="v-btn"
              style="color: #fff; background: ${btnBackColor}; padding:6px"
            >${btnValue}</button>`
            return str
          }
        },
      },
    },
    {
      fieldName: 'WRK_STUS_EQP',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('설비') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'WRK_STUS_VOL',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('작업량') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'WRK_STUS_SPD',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('작업속도') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'WRK_STUS_INC',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('작업내용') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'HO_NO1',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위1') },
    },
    {
      fieldName: 'HO_NO2',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위2') },
    },
    {
      fieldName: 'HO_NO3',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위3') },
    },
    {
      fieldName: 'TOT_PNT_1',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위1') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },

    {
      fieldName: 'TOT_PNT_2',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위2') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'TOT_PNT_3',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위3') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'YES_SYMPTOM',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('유증상') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        let ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          const iconSize = 15
          ret.style = { background: '#FFFFFF' }
          ret.renderer = {
            type: 'icon',
            iconLocation: 'right',
            iconCallback: function (grid, cell) {
              return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }

        return ret
      },
    },
    {
      fieldName: 'RESIST',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('개선등록') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          let IMP_RESIST_YN = grid.getValue(cell.index.itemIndex, 'IMP_RESIST_YN') //개선등록여부
          // let IMP_YN_B_FLAG_1 = grid.getValue(cell.index.itemIndex, 'IMP_YN_B_FLAG_1')
          // let IMP_YN_B_FLAG_2 = grid.getValue(cell.index.itemIndex, 'IMP_YN_B_FLAG_2')
          // let IMP_YN_B_FLAG_3 = grid.getValue(cell.index.itemIndex, 'IMP_YN_B_FLAG_3')
          if (!IMP_RESIST_YN) {
            let btnValue = '미등록'
            let btnBackColor = '#FF0000'
            var str = `<button
              class="v-btn"
              style="color: #fff; background: ${btnBackColor}; padding:6px"
            >${btnValue}</button>`
            return str
          } else if (IMP_RESIST_YN === 'Y') {
            let btnValue = '등록완료'
            let btnBackColor = '#0617D7'
            var str = `<button
              class="v-btn"
              style="color: #fff; background: ${btnBackColor}; padding:6px"
            >${btnValue}</button>`
            return str
          } else if (IMP_RESIST_YN === 'N') {
            let btnValue = '등록중'
            let btnBackColor = '#81c147'
            var str = `<button
              class="v-btn"
              style="color: #fff; background: ${btnBackColor}; padding:6px"
            >${btnValue}</button>`
            return str
          }
        },
      },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'ES_STUS',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('진행단계') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'ES_EMP_NM',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('조사자') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'INS_USR',
      header: { text: t('작업표준 작성자') },
    },
    {
      fieldName: 'PRODUCTION_MANAGER',
      header: { text: t('작업표준 담당자') },
    },
    //안보이는 컬럼
    {
      fieldName: 'ES_SEQ',
      visible: false,
      header: { text: t('순번') },
    },
    {
      fieldName: 'WORK_STANDARD_ID',
      visible: false,
      header: { text: t('작업표준번호') },
    },
    {
      fieldName: 'WORK_STANDARD_REVISION',
      visible: false,
      header: { text: t('작업표준리비전번호') },
    },
    {
      fieldName: 'ES_DATE',
      visible: false,
      header: { text: t('조사일자') },
    },
    {
      fieldName: 'CLOSE_DATE',
      visible: false,
      header: { text: t('완료처리일') },
    },
    {
      fieldName: 'ES_STUS_COD',
      visible: false,
      header: { text: t('진행상태코드') },
    },
    {
      fieldName: 'IMP_RESIST_YN',
      visible: false,
      header: { text: t('개선등록여부') },
    },
    {
      fieldName: 'COMPANY_CD',
      visible: false,
      header: { text: t('회사코드') },
    },
    {
      fieldName: 'OMIT_YN',
      visible: false,
      header: { text: t('조사생략 여부') },
    },
    {
      fieldName: 'ES_DEPT_NM',
      visible: false,
      header: { text: t('소속부서') },
    },
    {
      fieldName: 'IMP_YN_B_FLAG_1',
      visible: false,
      header: { text: t('단위작업1 현행유지사유 등록여부') },
    },
    {
      fieldName: 'IMP_YN_B_FLAG_2',
      visible: false,
      header: { text: t('단위작업2 현행유지사유 등록여부') },
    },
    {
      fieldName: 'IMP_YN_B_FLAG_3',
      visible: false,
      header: { text: t('단위작업3 현행유지사유 등록여부') },
    },
    {
      fieldName: 'DEPT_NM',
      visible: false,
      header: { text: t('부서/협력사') },
    },
    {
      fieldName: 'SAGO_DUTY_CD',
      visible: false,
      header: { text: t('직종코드') },
    },
    {
      fieldName: 'YEAR',
      visible: false,
      header: { text: t('기준년도') },
    },
    {
      fieldName: 'GROUP_YN',
      visible: false,
      header: { text: t('그룹핑여부') },
    },
    {
      fieldName: 'CORP_ASGN_CD', //이게 있으면 협력사고 없으면 직영임
      visible: false,
      header: { text: t('운영주관부서') },
    },
  ],
  columns: [],
  columnLayout: [
    'BSNS_CD',
    'DEPT_CD',
    'WORK_STANDARD_NO',
    'WORK_STANDARD_NM',
    'INS_USR',
    'PRODUCTION_MANAGER',
    'GROUP_NO',
    'BEFORE_DATE',
    {
      name: '조사개요',
      direction: 'horizontal',
      items: ['ES_DIV', 'SAGO_EMP_NM', 'SAGO_DUTY_NM', 'SAGO_BODY_CD'],
    },
    {
      name: '조사내용/개선',
      direction: 'horizontal',
      items: [
        'ES_RESIST',
        {
          name: '작업 상황 변화',
          direction: 'horizontal',
          items: ['WRK_STUS_EQP', 'WRK_STUS_VOL', 'WRK_STUS_SPD', 'WRK_STUS_INC'],
        },
        {
          name: '부담작업',
          direction: 'horizontal',
          items: ['HO_NO1', 'HO_NO2', 'HO_NO3'],
        },
        {
          name: '빈도*강도',
          direction: 'horizontal',
          items: ['TOT_PNT_1', 'TOT_PNT_2', 'TOT_PNT_3'],
        },
        'YES_SYMPTOM',
        'RESIST',
        'ES_STUS',
        'ES_EMP_NM',
        'ES_SEQ',
      ],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

//버튼 이벤트
const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData02).setAfter(afterSearch02).showMessage(false).run()
  } else if (btn.id === 'btnNewInvestigation') {
    let checkedData = grdMain.value.getGridView().getCheckedRows(true)
    if (checkedData.length === 0) {
      Message.warn(t('데이터를 선택해주세요.'))
      return false
    } else if (checkedData.length > 1) {
      Message.warn(t('한개의 작업표준번호만 체크 해주세요.'))
      return false
    }
    let rowState = grdMain.value.getDataProvider().getRowState(checkedData)
    if (rowState === 'created') {
      Message.warn(t('신규행은 신규 조사 등록 할 수 없습니다.'))
      return false
    }
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData) //선택한 작업표준 데이터 팝업열때 넘겨줌
    //종결된 데이터이거나, 아예 신규등록일때만 신규조사등록 가능
    if (!data.ES_STUS_COD || data.ES_STUS_COD === '7') {
      data.isAdmin = isAdmin.value //권리자 권한 플래그값 추가해서 넘겨줌
      hLTIB0010Popup01.value.openPopup(data)
    } else {
      Message.warn(t('진행단계가 종결인 데이터만 신규 조사 등록이 가능합니다.'))
      return false
    }
  } else if (btn.id === 'btnCreate') {
    //관리자가 아니면 로그인유저 소속 사업부,부서 세팅
    if (!isAdmin.value) {
      if (userStore.userDiv === 'A') {
        let bsnsCd = codeList.GRID_BSNS_CD.filter((x) => x.BSNS_CD === userStore.bsnsCd)
        let deptCd = codeList.GRID_DEPT_CD.filter((x) => x.DEPT_CD === userStore.deptCd)
        codeList.bsnsCd = bsnsCd
        codeList.deptCd = deptCd
      } else {
        let bsnsCd = codeList.GRID_BSNS_CD.filter((x) => x.BSNS_CD === userStore.bsnsCd)
        let asgnCd = codeList.GRID_DEPT_CD.filter((x) => x.DEPT_CD === userStore.asgnCd)
        codeList.bsnsCd = bsnsCd
        codeList.deptCd = asgnCd
      }

      grdMain.value.addRow({ BSNS_CD: codeList.bsnsCd[0].BSNS_CD, DEPT_CD: codeList.deptCd[0].DEPT_CD }, false)
    } else {
      //관리자면 전부 선택가능
      grdMain.value.addRow({}, false)
    }
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(afterSave).run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(afterDelete).run()
  } else if (btn.id === 'btnRowGrouping') {
    let checkedData = grdMain.value.getGridView().getCheckedRows(true)
    if (checkedData.length < 2) {
      Message.warn(t('그룹화할 데이터를 2개이상 선택해주세요.'))
      return false
    }
    //그룹화할 데이터 최대 갯수 제한
    else if (checkedData.length > 50) {
      Message.warn(t('그룹화는 최대 50개까지 가능합니다.'))
      return false
    }
    let rowData = []
    for (let i = 0; i < checkedData.length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
      //그룹핑할때 조사등록된 작업에 대해서는 그룹핑 불가
      if (data.ES_SEQ) {
        Message.warn(t('조사등록된 데이터는 그룹화 할 수 없습니다.'))
        return false
      } else if (data.GROUP_YN === 'Y') {
        Message.warn(t('그룹화된 데이터는 그룹화 할 수 없습니다.'))
        return false
      }
      rowData.push(data)
    }

    hLTIB0010Popup05.value.openPopup(rowData)
  } else if (btn.id === 'btnGetDeptWorkStandard') {
    if (!searchParam.BSNS_CD || !searchParam.DEPT_CD) {
      Message.warn(t('특정사업부와 특정부서를 선택해주세요.'))
      return false
    }
    let result = await vm.$swal({
      title: `
      <div style=color:red;>
            ※ 부서작업표준 가져오기를 실행하면 
              기존의 그룹화가 모두 해제됩니다.
                진행하시겠습니까?
      </div>`,
      showCancelButton: true,
    })
    if (result.isConfirmed) {
      let saveParam = []
      let param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParam.BSNS_CD,
        DEPT_CD: searchParam.DEPT_CD,
        VEND_CD: searchParam.VEND_CD,
        USER_DIV: searchParam.USER_DIV,
        USER_ID: userStore.userId,
      }
      saveParam.push(param)
      commonExecuteApi({
        queryId: 'HLTIB0010_SAVE_16',
        list: saveParam,
      }).then((res) => {
        onButtonsClick({ id: 'btnSearch' })
      })
    }
  } else if (btn.id === 'btnReqApply') {
    let checkedData = grdMain.value.getGridView().getCheckedRows(true)

    if (checkedData.length === 0) {
      Message.warn(t('데이터를 선택해주세요.'))
      return false
    }
    let userDivA = [] //직영 조사건
    let userDivB = [] //협력사 조사건

    for (let i = 0; i < checkedData.length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])

      //협력사 결제건만
      if (data.CORP_ASGN_CD) {
        userDivB.push(data)
      } else {
        //직영 결제건만
        userDivA.push(data)
      }
    }
    if (userDivA.length > 0 && userDivB.length > 0) {
      Message.warn(t('직영 또는 협력사조사건만 선택 해주세요.'))
      return false
    }
    //직영건
    if (userDivA.length > 0 && userDivB.length === 0) {
      for (let i = 0; i < checkedData.length; i++) {
        let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
        //조사완료가 안되었거나 개선등록이 완료되지 않았고, 단위작업에 등록된 데이터가 모두 현행유지가 아닐때
        if (!data.CLOSE_DATE || !data.IMP_RESIST_YN) {
          Message.warn(t('조사 등록 및 개선 등록 완료건만 결재상신 가능합니다.'))
          return false
        } else if (data.ES_STUS === '종결') {
          Message.warn(t('종결된건은 결제상신 할 수 없습니다.'))
          return false
        }
      }
      approvalPopup.value.openPopup({
        CLSS_ID: logsStore.vueId,
        TITLE: '근골격계 유해요인조사 결과 보고',
        CMPNY_DIV: userStore.cmpnyDiv,
        DATA_KEY:
          userStore.cmpnyDiv +
          ';' +
          userStore.bsnsCd +
          ';' +
          userStore.deptCd +
          ';' +
          userStore.asgnCd +
          ';' +
          new Date().getFullYear(),
        REPORT: setReport(),
        MODE: '3',
        FOEM_ID: '421',
        CLRLINE: 'CLR_15',
      })
    }
    //협력사건
    else if (userDivB.length > 0 && userDivA.length === 0) {
      let result = await vm.$swal({
        title: '협력사건은 결재 과정 없이 종결처리됩니다.',
        showCancelButton: true,
      })
      if (result.isConfirmed) {
        let saveParam = []
        for (let i = 0; i < checkedData.length; i++) {
          let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
          let saveData = {
            CMPNY_DIV: userStore.cmpnyDiv,
            WORK_STANDARD_ID: data.WORK_STANDARD_ID,
            ES_SEQ: data.ES_SEQ,
            USER_ID: userStore.userId,
          }
          saveParam.push(saveData)
        }
        commonExecuteApi({
          queryId: 'HLTIB0010_SAVE_19',
          list: saveParam,
        }).then((res) => {
          Message.success(t('종결처리 되었습니다.'))
          onButtonsClick({ id: 'btnSearch' })
        })
      }
    }
  }
}

const setReport = (data) => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  let htmlTableRows = ''

  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    //3/4에서 모두 현행유지로 선택했을때
    if (data.IMP_YN_B_FLAG_1 === 'Y' || data.IMP_YN_B_FLAG_2 === 'Y' || data.IMP_YN_B_FLAG_3 === 'Y') {
      data.IMP_RESIST_YN = '현행유지'
    } else {
      data.IMP_RESIST_YN = '개선완료'
    }
    let HO_NO = ''
    if (data.HO_NO1 == '0' && data.HO_NO2 == '0' && data.HO_NO3 == '0') {
      HO_NO = '미해당'
    } else {
      HO_NO = '해당'
    }
    htmlTableRows += `
    <tr>
      <td>${i + 1}</td>
      <td>${data.WORK_STANDARD_NM}</td>
      <td>${data.ES_DATE}</td>
      <td>${data.ES_DIV === 'A1' ? '정기' : '수시'}</td>
      <td>${data.ES_DIV === 'A2' ? codeList.SAGO_BODY_CD.find((x) => x.COD === data.SAGO_BODY_CD)?.TXT || '' : ''}</td>
      <td>${HO_NO}</td>
      <td>${data.YES_SYMPTOM}</td>
      <td>${data.IMP_RESIST_YN}</td>
    </tr>
  `
  }
  let htmlReport = `
<html>
  <head>
    <style>
    .fontBold {
      font-weight: bold;
      font-size: 18px;
      margin-bottom: 4px;
      text-align: left;
    }
      table {
        border-collapse: collapse;
        width: 100%;
        margin-top: 20px;
      }
      th, td {
        border: 1px solid #000;
        padding: 8px;

      }
      thead {
        background-color: #5b9bd5;
        color: white;
      }
    </style>
  </head>
  <body>
    <div class="fontBold">1. 법적 근거</div>
    <div class="fontBold">산업안전보건기준에 관한 규칙 제 657조(유해요인조사)</div>
    <div style="margin-bottom: 4px; text-align: left;">
      ① 사업주는 근로자가 근골격계부담작업을 하는 경우에 3년마다 유해요인조사를
      하여야 한다.
    </div>
    <div style="margin-bottom: 4px ; text-align: left">
      ② 1항에도 불구하고 다음 각 호의 어느 하나에 해당하는 사유 발생 시 1개월
      이내 유해요인조사를 하여야 한다.
    </div>
    <div style="margin-bottom: 4px ; text-align: left">
      - 임시건강진단 등에서 근골격계질환자가 발생하였거나 근골격계질환으로
      업무상 질병으로 인정 받은 경우
    </div>
    <div style="margin-bottom: 4px ; text-align: left">
      - 근골격계부담작업에 해당하는 새로운 작업·설비를 도입한 경우
    </div>
    <div style="margin-bottom: 4px ; text-align: left">
      - 근골격계부담작업에 해당하는 업무의 양과 작업공정 등 작업환경을 변경한
      경우
    </div>
    <div class="fontBold" style="margin-top: 8px">2. 조사 / 개선 내용</div>
    <table>
      <thead>
        <tr>
          <th>순</th>
          <th>작업표준명</th>
          <th>조사일</th>
          <th>조사구분</th>
          <th>신체부위</th>
          <th>부담작업 여부</th>
          <th>유증상자 수</th>
          <th>개선 여부</th>
        </tr>
      </thead>
      <tbody>
        ${htmlTableRows}
      </tbody>
    </table>
  </body>
</html>
`

  return htmlReport
}

//저장관련 로직 시작
const beforeSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('저장할 데이터를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < checkedData.length; i++) {
    let rowState = grdMain.value.getDataProvider().getRowState(checkedData[i])
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (rowState !== 'created') {
      Message.warn(t('신규추가행만 저장 가능합니다.'))
      return false
    } else if (!data.BSNS_CD) {
      Message.warn(t('사업부를 입력해주세요.'))
      return false
    } else if (!data.DEPT_CD) {
      Message.warn(t('부서를 입력해주세요.'))
      return false
    } else if (!data.WORK_STANDARD_NO) {
      Message.warn(t('작업표준번호를 입력해주세요.'))
      return false
    } else if (!data.WORK_STANDARD_NM) {
      Message.warn(t('작업표준명을 입력해주세요.'))
      return false
    }
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      COMPANY_CD: userStore.cmpnyDiv,
      DEPT_CD: data.DEPT_CD,
      BSNS_CD: data.BSNS_CD,
      WORK_STANDARD_NO: data.WORK_STANDARD_NO,
      WORK_STANDARD_NM: data.WORK_STANDARD_NM,
      CORP_ASGN_CD: '',
      USER_DIV: userStore.userDiv,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }

  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_12',
    list: saveParam,
  })
}

const afterSave = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//저장관련 로직 끝

//삭제관련 로직 시작
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      WORK_STANDARD_NO: data.WORK_STANDARD_NO,
      COMPANY_CD: data.COMPANY_CD,
      DEPT_CD: data.DEPT_CD,
      BSNS_CD: data.BSNS_CD,
      WORK_STANDARD_REVISION: data.WORK_STANDARD_REVISION,
    }
    deleteParam.push(deleteData)
  }

  return commonExecuteApi({
    queryId: 'HLTIB0010_DELETE_03',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//조회관련 로직 시작 -> 마스터테이블에 데이터가 없으면 작업표준ID,작업표준리비젼번호,작업표준명 업데이트 및 인서트
const searchData01 = () => {
  return commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_99',
    param: searchParam,
  })
}

const afterSearch01 = async (res) => {
  //유해요인조사 마스터 테이블에 로그인유저 소속 작업표준서 데이터가 존재하지 않으면
  if (res.ORESULT_CUR[0].COUNT === 0) {
    searchParam.USER_ID = userStore.userId
    searchParam.COUNT = res.ORESULT_CUR[0].COUNT
    //마스터테이블에 데이터 넣는다.(없을수도 있다.)
    commonExecuteApi({
      queryId: 'HLTIB0010_SAVE_99',
      list: [searchParam],
    }).then((res) => {
      onButtonsClick({ id: 'btnSearch' })
    })
  } else {
    //유해요인조사 마스터 테이블에 로그인유저 소속 작업표준서 데이터가 존재한다면
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_98',
      param: searchParam,
    }).then(async (res2) => {
      //3년전 데이터가 존재하면
      if (res2.ORESULT_CUR[0].COUNT > 0) {
        let result = await vm.$swal({
          title: t(`작업표준서 갱신 시기가 도래하여
                    작업표준서 갱신을 진행합니다.
                    `),
          showCancelButton: true,
        })
        if (result.isConfirmed) {
          //새로생긴 작업표준서는 저장, 기존에 있는 작업표준서는 업데이트
          searchParam.USER_ID = userStore.userId
          searchParam.COUNT = res.ORESULT_CUR[0].COUNT
          commonExecuteApi({
            queryId: 'HLTIB0010_SAVE_99',
            list: [searchParam],
          }).then(() => {
            onButtonsClick({ id: 'btnSearch' })
          })
        }
      }
      // if (res2.ORESULT_CUR[1].COUNT !== res2.ORESULT_CUR[2].COUNT) {
      //   let result = await vm.$swal({
      //     title: `
      //           3년 단위 근골격계 정기유해요인조사
      //           주기가 도래하였으니,
      //           모든 작업표준에 대하여 조사 진행 바랍니다.
      //             (별도 안내 예정)
      //         ※ 문 의 : 안전보건지원부 임은희 책임(2-5407)
      //   `,
      //   })
      //   if (result.isConfirmed) {
      //     commonSearchApi({
      //       queryId: 'HLTIB0010_SEARCH_01',
      //       param: searchParam,
      //     }).then((res) => {
      //       grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      //       if (res.ORESULT_CUR.length === 0) {
      //         Message.warn('데이터가 없습니다.')
      //       } else {
      //         Message.success('조회되었습니다.')
      //       }
      //     })
      //   }
      // }
    })
  }
}
//조회관련 로직 끝

//조회관련 로직 시작
const searchData02 = () => {
  return commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch02 = (res) => {
  //조회해서 데이터가 존재하지 않고,관리자일때는 조회조건에 해당하는 부서의 작업표준 데이터를 가져온다.(사업부,부서,협력사중 하나라도 전체면 저장하지 않는다. DB부하로 인해 조회만 되도록)
  if (
    res.ORESULT_CUR.length === 0 &&
    searchParam.BSNS_CD !== '' &&
    searchParam.DEPT_CD !== '' //&&
    //searchParam.VEND_CD !== ''
  ) {
    //관리자이다.
    if (isAdmin.value) {
      searchParam.USER_ID = userStore.userId
      searchParam.COUNT = res.ORESULT_CUR.length
      //유해요인마스터에 데이터 저장 -> 기준년도 변경하면 안타도록(작업표준 데이터는 년도에 상관없이 다 불러와서 최초 저장하고 난 다음에 다시 저장하면 pk 에렁남)
      if (searchParam.YEAR == new Date().getFullYear()) {
        commonExecuteApi({
          queryId: 'HLTIB0010_SAVE_99',
          list: [searchParam],
        }).then(() => {
          //조회
          commonSearchApi({
            queryId: 'HLTIB0010_SEARCH_01',
            param: searchParam,
          }).then((res) => {
            if (res.ORESULT_CUR.length === 0) {
              Message.warn('데이터가 없습니다.')
            } else {
              grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
              Message.success('조회되었습니다.')
            }
          })
        })
      } else {
        commonSearchApi({
          queryId: 'HLTIB0010_SEARCH_01',
          param: searchParam,
        }).then((res) => {
          if (res.ORESULT_CUR.length === 0) {
            Message.warn('데이터가 없습니다.')
          } else {
            grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
            Message.success('조회되었습니다.')
          }
        })
      }
    } else {
      //관리자가 아니다.(작업표준서 저장 하지않고 조회만)
      commonSearchApi({
        queryId: 'HLTIB0010_SEARCH_01',
        param: searchParam,
      }).then((res) => {
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
        if (res.ORESULT_CUR.length === 0) {
          Message.warn('데이터가 없습니다.')
        } else {
          Message.success('조회되었습니다.')
        }
      })
    }
  } else {
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_98',
      param: searchParam,
    }).then(async (res2) => {
      //3년전 데이터가 존재한다.
      if (res2.ORESULT_CUR[0].COUNT > 0) {
        let result = await vm.$swal({
          title: t(`작업표준서 갱신 시기가 도래하여
                    작업표준서 갱신을 진행합니다.
                    `),
          showCancelButton: true,
        })
        if (result.isConfirmed) {
          searchParam.USER_ID = userStore.userId
          searchParam.COUNT = res2.ORESULT_CUR[0].COUNT
          //3년전데이터와 현재 데이터를 비교해서 저장 및 수정
          commonExecuteApi({
            queryId: 'HLTIB0010_SAVE_99',
            list: [searchParam],
          }).then(() => {
            //조회
            commonSearchApi({
              queryId: 'HLTIB0010_SEARCH_01',
              param: searchParam,
            }).then((res) => {
              if (res.ORESULT_CUR.length === 0) {
                Message.warn('데이터가 없습니다.')
              } else {
                grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
                Message.success('조회되었습니다.')
              }
            })
          })
        } else {
          commonSearchApi({
            queryId: 'HLTIB0010_SEARCH_01',
            param: searchParam,
          }).then((res) => {
            grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
            if (res.ORESULT_CUR.length === 0) {
              Message.warn('데이터가 없습니다.')
            } else {
              Message.success('조회되었습니다.')
            }
          })
        }
      } else {
        commonSearchApi({
          queryId: 'HLTIB0010_SEARCH_01',
          param: searchParam,
        }).then((res) => {
          grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
          if (res.ORESULT_CUR.length === 0) {
            Message.warn('데이터가 없습니다.')
          } else {
            Message.success('조회되었습니다.')
          }
        })
      }
    })
  }
}

onMounted(async () => {
  menuTitle.value.visibleBtn('btnGetDeptWorkStandard', false) //2025.10.20 김현재 작성 안전보건지원부 임은희책임 요청으로 부서작업표준가져오기 버튼 안보이기 (관리자일때는 보이기)
  let result = await checkGroupAuth()
  if (!result) {
    return false
  }

  onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().filterPanel.visible = true
  initCodeList()

  //관리자가 아닐때는 본인 소속 데이터 가져옴
  if (
    !userStore.authGrpCd.includes('GRP00372') &&
    !userStore.authGrpCd.includes('HLTI001') &&
    !userStore.authGrpCd.includes('HIWAYGRP00001') &&
    logsStore.isMenuAdmin !== 'Y'
  ) {
    new queryFlowHelper(vm, t).setQuery(searchData01).setAfter(afterSearch01).showMessage(false).run()
  } else {
    onButtonsClick({ id: 'btnSearch' })
  }
})

//로그인유저의 권한을 확인하는 함수
const checkGroupAuth = async () => {
  // 1. 관리자 권한 체크
  if (
    userStore.authGrpCd.includes('GRP00372') ||
    userStore.authGrpCd.includes('HLTI001') ||
    userStore.authGrpCd.includes('HIWAYGRP00001') ||
    logsStore.isMenuAdmin === 'Y'
  ) {
    isAdmin.value = true
    searchParam.USER_DIV = 'A'
    readOnlyValue.BSNS_CD = false
    readOnlyValue.DEPT_CD = false
    readOnlyValue.VEND_CD = false
    menuTitle.value.visibleBtn('btnGetDeptWorkStandard', true)
    return true
  }

  try {
    // 2. HEMP 운영조직 조회
    const [res1, res2] = await Promise.all([
      commonSearchApi({
        queryId: 'HLTIA0010_SEARCH_02',
        param: searchParam,
      }),
      commonSearchApi({
        queryId: 'HLTIA0010_SEARCH_04',
        param: searchParam,
      }),
    ])

    const hempList = [...res1.ORESULT_CUR, ...res2.ORESULT_CUR]
    const hempEmp = []
    //HEMP운영조직에 등록된 인원이 없으면
    if (hempList.length === 0) {
      if (userStore.userDiv === 'A') {
        //직영은 사업부,부서만 고정
        readOnlyValue.BSNS_CD = true
        readOnlyValue.DEPT_CD = true
        readOnlyValue.VEND_CD = false
      } else {
        //협력사는 사업부,부서,협력사 고정
        readOnlyValue.BSNS_CD = true
        readOnlyValue.DEPT_CD = true
        readOnlyValue.VEND_CD = true
      }
      nomalUser.value = true
      // menuTitle.value.disableBtn('btnCreate', true) //추가 비활성화
      // menuTitle.value.disableBtn('btnUpdate', true) //저장 비활성화
      // menuTitle.value.disableBtn('btnDelete', true) //삭제 비활성화
      // menuTitle.value.disableBtn('btnRowGrouping', true) //행그룹화 비활성화
      // menuTitle.value.disableBtn('btnGetDeptWorkStandard', true) //부서작업표준가져오기 비활성화
      // menuTitle.value.disableBtn('btnNewInvestigation', true) //신규조사등록 비활성화
      // menuTitle.value.disableBtn('btnReqApply', true) //결재상신 비활성화

      return true
    } else {
      //HEMP운영조직에 등록된 인원이 로그인유저와 일치하면
      for (const item of hempList) {
        if (userStore.empNo === item.EMP_NO) {
          hempEmp.push(userStore.empNo)
          if (userStore.userDiv === 'A') {
            //직영은 사업부,부서만 고정
            readOnlyValue.BSNS_CD = true
            readOnlyValue.DEPT_CD = true
            readOnlyValue.VEND_CD = false
          } else {
            //협력사는 사업부,부서,협력사 고정
            readOnlyValue.BSNS_CD = true
            readOnlyValue.DEPT_CD = true
            readOnlyValue.VEND_CD = true
          }
          return true
        }
      }
      if (hempEmp.length === 0) {
        //HEMP운영조직에 등록된 인원이 있는데 로그인 유저는 등록되어있지 않는 경우는 조회만(일반사용자)
        if (userStore.userDiv === 'A') {
          //직영은 사업부,부서만 고정
          readOnlyValue.BSNS_CD = true
          readOnlyValue.DEPT_CD = true
          readOnlyValue.VEND_CD = false
        } else {
          //협력사는 사업부,부서,협력사 고정
          readOnlyValue.BSNS_CD = true
          readOnlyValue.DEPT_CD = true
          readOnlyValue.VEND_CD = true
        }
        nomalUser.value = true
        // menuTitle.value.disableBtn('btnCreate', true) //추가 비활성화
        // menuTitle.value.disableBtn('btnUpdate', true) //저장 비활성화
        // menuTitle.value.disableBtn('btnDelete', true) //삭제 비활성화
        // menuTitle.value.disableBtn('btnRowGrouping', true) //행그룹화 비활성화
        // menuTitle.value.disableBtn('btnGetDeptWorkStandard', true) //부서작업표준가져오기 비활성화
        // menuTitle.value.disableBtn('btnNewInvestigation', true) //신규조사등록 비활성화
        // menuTitle.value.disableBtn('btnReqApply', true) //결재상신 비활성화
        return true
      }
    }
  } catch (e) {
    await vm.$swal({
      title: '권한 확인 중 오류가 발생했습니다.',
      text: e.message || '',
      icon: 'error',
      confirmButtonText: '확인',
    })
    return false
  }
}

// const checkGroupAuth = async () => {
//   //권한이 보건총괄관리자,근골격계질환 예방 모듈 관리자,admin그룹이면 모든 데이터 조회 및 수정가능
//   if (
//     userStore.authGrpCd.includes('GRP00372') ||
//     userStore.authGrpCd.includes('HLTI001') ||
//     userStore.authGrpCd.includes('HIWAYGRP00001') ||
//     logsStore.isMenuAdmin === 'Y'
//   ) {
//     //console.log('관리자이다. 모든기능 활성화')
//     isAdmin.value = true
//     searchParam.USER_DIV = 'A' //관리자일대는 A로 조회를한다.
//     readOnlyValue.BSNS_CD = false
//     readOnlyValue.DEPT_CD = false
//     readOnlyValue.VEND_CD = false
//     return true
//   }
//   //HEMP운영조직에 등록되었는지 확인
//   //해당되지 않으면 접근불가
//   Promise.all([
//     commonSearchApi({
//       queryId: 'HLTIA0010_SEARCH_02',
//       param: searchParam,
//     }),
//     commonSearchApi({
//       queryId: 'HLTIA0010_SEARCH_04',
//       param: searchParam,
//     }),
//   ]).then(async (res) => {
//     let hempList = [...res[0].ORESULT_CUR, ...res[1].ORESULT_CUR]
//     let hempEmp = []
//     //아무것도 등록 안되어 있을때
//     console.log('res', res)
//     if (hempList.length === 0) {
//       let result = await vm.$swal({
//         title: `접근권한이 없습니다.`,
//       })
//       if (result.isConfirmed) {
//         menuTitle.value.disableBtn('btnNewInvestigation', true) //신규조사등록 비활성화
//         menuTitle.value.disableBtn('btnReqApply', true) //결재상신 비활성화
//         menuTitle.value.disableBtn('btnUpdate', true) //저장 비활성화
//         menuTitle.value.disableBtn('btnCreate', true) //추가 비활성화
//         menuTitle.value.disableBtn('btnDelete', true) //삭제 비활성화
//         menuTitle.value.disableBtn('btnSearch', true) //조회 비활성화
//         menuTitle.value.disableBtn('btnRowGrouping', true) //행그룹화 비활성화
//         menuTitle.value.disableBtn('btnGetDeptWorkStandard', true) //부서작업표준가져오기 비활성화
//         return false
//       }
//     } else {
//       console.log('hempList', hempList)
//       for (let i = 0; i < hempList.length; i++) {
//         //HEMP운영조직에 등록된 인원이면 본인 소속 데이터만 접근가능
//         if (userStore.empNo === hempList[i].EMP_NO) {
//           console.log('이거안탐??', hempList[i].EMP_NO)
//           hempEmp.push(userStore.empNo)
//           readOnlyValue.BSNS_CD = true
//           readOnlyValue.DEPT_CD = true
//           readOnlyValue.VEND_CD = true
//           return true
//         }
//       }

//       if (hempEmp.length === 0) {
//         let result = await vm.$swal({
//           title: `접근권한이 없습니다.`,
//         })
//         if (result.isConfirmed) {
//           menuTitle.value.disableBtn('btnNewInvestigation', true) //신규조사등록 비활성화
//           menuTitle.value.disableBtn('btnReqApply', true) //결재상신 비활성화
//           menuTitle.value.disableBtn('btnUpdate', true) //저장 비활성화
//           menuTitle.value.disableBtn('btnCreate', true) //추가 비활성화
//           menuTitle.value.disableBtn('btnDelete', true) //삭제 비활성화
//           menuTitle.value.disableBtn('btnSearch', true) //조회 비활성화
//           menuTitle.value.disableBtn('btnRowGrouping', true) //행그룹화 비활성화
//           menuTitle.value.disableBtn('btnGetDeptWorkStandard', true) //부서작업표준가져오기 비활성화

//           return false
//         }
//       }
//     }
//   })
// }

const onCellClicked = async (grid, clickData) => {
  //개선등록 클릭 이벤트
  if (clickData.column === 'RESIST') {
    let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    if (!rowData.ES_SEQ) {
      Message.warn(t('신규조사등록을 먼저 진행해주세요.'))
      return false
    }
    if (!rowData.CLOSE_DATE) {
      Message.warn(t('조사완료 후 개선등록이 가능합니다.'))
      return false
    }
    //개선등록완료시에는 확인 팝업 안띄움
    if (rowData.IMP_RESIST_YN === 'Y') {
      if (nomalUser.value) {
        rowData.nomalUser = true
      }
      hLTIB0010Popup02.value.openPopup(rowData)
    } else {
      //일반사용자일때
      if (nomalUser.value) {
        //개선등록이 미등록일때
        if (!rowData.IMP_RESIST_YN) {
          Message.warn(t('개선등록 권한이 없습니다.'))
          return false
        }
        //개선등록이 등록중일때
        else if (rowData.IMP_RESIST_YN === 'N') {
          rowData.nomalUser = true
          hLTIB0010Popup02.value.openPopup(rowData)
        }
      } else {
        let result = await vm.$swal({
          title: `개선등록후 조사등록 수정이 불가합니다.
                  등록하시겠습니까?`,
          showCancelButton: true,
        })
        if (result.isConfirmed) {
          hLTIB0010Popup02.value.openPopup(rowData)
        }
      }
    }
    //단위작업에 모든 데이터가 현행유지로 등록시에는 false 리턴
    // if (rowData.IMP_YN_B_FLAG_1 === 'Y' && rowData.IMP_YN_B_FLAG_2 === 'Y' && rowData.IMP_YN_B_FLAG_3 === 'Y') {
    //   //개선등록여부가 모두 현행유지로 등록 되었으므로 개선등록을 등록으로 변경합니다 진행하시겠습니까??????
    //   console.log('이게 타는건가?')
    //   console.log('rowData.IMP_YN_B_FLAG_1', rowData.IMP_YN_B_FLAG_1)
    //   console.log('rowData.IMP_YN_B_FLAG_2', rowData.IMP_YN_B_FLAG_2)
    //   console.log('rowData.IMP_YN_B_FLAG_3', rowData.IMP_YN_B_FLAG_3)
    //   return false
    // }
  }
  //이전조사일 클릭 이벤트
  if (clickData.column === 'BEFORE_DATE') {
    let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    if (!rowData.ES_SEQ) {
      Message.warn(t('조사내역이 없습니다. 신규조사등록을 해주세요.'))
      return false
    }
    hLTIB0010Popup03.value.openPopup(rowData)
  }
  //유증상 클릭 이벤트
  if (clickData.column === 'YES_SYMPTOM') {
    let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    if (!rowData.ES_SEQ) {
      Message.warn(t('조사내역이 없습니다. 신규조사등록을 해주세요.'))
      return false
    } else if (rowData.OMIT_YN === 'Y') {
      Message.warn(t('조사 생략건 입니다.'))
      return false
    }

    hLTIB0010Popup04.value.openPopup(rowData)
  }
  //조사등록 클릭 이벤트
  if (clickData.column === 'ES_RESIST') {
    if (!nomalUser.value) {
      let rowState = grdMain.value.getDataProvider().getRowState(clickData.dataRow)
      let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
      if (rowState === 'created') {
        Message.warn(t('신규행은 조사등록 할 수 없습니다.'))
        return false
      } else if (!rowData.ES_SEQ) {
        //관리자권한 플래그값 추가해서 넘겨줌
        rowData.isAdmin = isAdmin.value
        //그룹핑안된 데이터는 그냥 팝업 열기
        if (!rowData.GROUP_YN) {
          let result = await vm.$swal({
            title: `조사등록시 그룹화 불가능 합니다.
               진행하시겠습니까?`,
            showCancelButton: true,
          })
          if (result.isConfirmed) {
            hLTIB0010Popup01.value.openPopup(rowData)
          }
        } else {
          hLTIB0010Popup01.value.openPopup(rowData)
        }
      } else if (rowData.ES_SEQ) {
        //관리자권한 플래그값 추가해서 넘겨줌
        rowData.isAdmin = isAdmin.value
        hLTIB0010Popup01.value.openPopup2(rowData)
      }
    } else {
      let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
      if (!rowData.ES_SEQ) {
        Message.warn(t('조사 등록된 건이 없습니다.'))
        return false
      } else {
        //일반사용자면 조회만
        rowData.nomalUser = nomalUser.value
        hLTIB0010Popup01.value.openPopup2(rowData)
      }
    }
  }
}

const approvalRequest = (val) => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  let saveParam = []
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i]) //선택한 작업표준 데이터 팝업열때 넘겨줌
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv,
      WORK_STANDARD_ID: data.WORK_STANDARD_ID,
      ES_SEQ: data.ES_SEQ,
      APPROVE_ID: val.appkey,
    }
    saveParam.push(saveData)
  }

  commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_09',
    list: saveParam,
  }).then(() => {
    onButtonsClick({ id: 'btnSearch' })
  })
}

//조사생략시 조사완료로 상태값 업데이트
const updateEsStus = (val) => {
  let ES_SEQ = ''
  if (val.ES_SEQ) {
    ES_SEQ = val.ES_SEQ
  } else {
    ES_SEQ = val.OUT_RES_ES_SEQ
  }
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    WORK_STANDARD_ID: val.WORK_STANDARD_ID,
    ES_SEQ: ES_SEQ,
    OMIT_REMARKS: val.OMIT_REMARKS,
  }
  saveParam.push(saveData)
  commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_11',
    list: saveParam,
  }).then(() => {
    onButtonsClick({ id: 'btnSearch' })
  })
}

//조사생략된 상태에서 조사생략조건이 아닌 데이터로 변경시 조사생략값 제거
const deleteOmitYn = (val) => {
  let saveParam = []
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    WORK_STANDARD_ID: val.WORK_STANDARD_ID,
    ES_SEQ: val.ES_SEQ,
    USER_ID: userStore.userId,
  }
  saveParam.push(saveData)
  commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_13',
    list: saveParam,
  })
}

//사업부 변경시 부서 조회
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      //사업부가 전체면 부서,협력사 전체값으로
      if (newValue === '') {
        codeList.DEPT_CD = []
        codeList.DEPT_CD.push({ DEPT_NM: '전체', DEPT_CD: '' })
        codeList.VEND_CD = []
        codeList.VEND_CD.push({ ASGN_NM: '전체', ASGN_CD: '' })
        codeList.VEND_CD.unshift({ ASGN_NM: '선택안함', ASGN_CD: 'N' })
        searchParam.DEPT_CD = ''
        searchParam.VEND_CD = 'N' //2025.07.30 김현재 작성 임은희책임 요청으로 사업부,부서 변경시 협력사는 선택안함으로
      } else {
        searchParam.DEPT_CD = ''
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        codeList.VEND_CD = []
        codeList.VEND_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
        codeList.VEND_CD.unshift({ ASGN_NM: '선택안함', ASGN_CD: 'N' })
        searchParam.VEND_CD = 'N' //2025.07.30 김현재 작성 임은희책임 요청으로 사업부,부서 변경시 협력사는 선택안함으로
      }
    })
  }
)

//부서변경시 협력사 조회
watch(
  () => searchParam.DEPT_CD,
  (newValue, oldValue) => {
    //협력사조회
    commonSearchApi({
      queryId: 'searchVend',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, DEPT_CD: newValue },
    }).then((res) => {
      if (newValue === '') {
        codeList.VEND_CD = []
        codeList.VEND_CD.push({ ASGN_NM: '전체', ASGN_CD: '' })
        codeList.VEND_CD.unshift({ ASGN_NM: '선택안함', ASGN_CD: 'N' })
        searchParam.VEND_CD = 'N' //2025.07.30 김현재 작성 임은희책임 요청으로 사업부,부서 변경시 협력사는 선택안함으로
      } else {
        searchParam.VEND_CD = ''
        codeList.VEND_CD = res.ORESULT_CUR
        codeList.VEND_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
        codeList.VEND_CD.unshift({ ASGN_NM: '선택안함', ASGN_CD: 'N' })
        searchParam.VEND_CD = 'N' //2025.07.30 김현재 작성 임은희책임 요청으로 사업부,부서 변경시 협력사는 선택안함으로
      }
    })
  }
)

// watch(
//   () => searchParam.VEND_CD,
//   (newValue, oldValue) => {
//     //관리자이고 협력사를 선택했으면
//     if (isAdmin.value === true && newValue) {
//       searchParam.USER_DIV = 'B'
//     }
//     //관리자가 아니고 로그인유저가 협력사이면
//     else if (isAdmin.value === false && userStore.userDiv === 'B') {
//       searchParam.USER_DIV = 'B' //
//     } else {
//       searchParam.USER_DIV = 'A'
//     }
//   },
//   {
//     immediate: true,
//   }
// )
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnSearch',
          'btnCreate',
          'btnUpdate',
          'btnDelete',
          'btnRowGrouping',
          'btnGetDeptWorkStandard',
          'btnNewInvestigation',
          'btnReqApply',
        ]"
        @click-button="onButtonsClick"
        :use-permission="false"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select :label="$t('기준년도')" width="200px" v-model="searchParam.YEAR" type="YEAR"></i-select>
            <i-select
              :label="$t('조사구분')"
              :items="codeList.ES_DIV"
              item-title="TXT"
              item-value="COD"
              width="200px"
              v-model="searchParam.ES_DIV"
            ></i-select>
            <i-select
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              width="200px"
              label-width="50px"
              v-model="searchParam.BSNS_CD"
              :readonly="readOnlyValue.BSNS_CD"
            ></i-select>
            <i-select
              :label="$t('부서')"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              width="200px"
              label-width="50px"
              v-model="searchParam.DEPT_CD"
              :readonly="readOnlyValue.DEPT_CD"
            ></i-select>
            <i-select
              :label="$t('협력사')"
              width="200px"
              :items="codeList.VEND_CD"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              label-width="50px"
              v-model="searchParam.VEND_CD"
              :readonly="readOnlyValue.VEND_CD"
            ></i-select>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <HLTIB0010Popup01
    ref="hLTIB0010Popup01"
    @closed="() => onButtonsClick({ id: 'btnSearch' })"
    @omitedSave="updateEsStus"
    @deleteOmitYn="deleteOmitYn"
  ></HLTIB0010Popup01>
  <HLTIB0010Popup02 ref="hLTIB0010Popup02" @closed="() => onButtonsClick({ id: 'btnSearch' })"></HLTIB0010Popup02>
  <HLTIB0010Popup03 ref="hLTIB0010Popup03"></HLTIB0010Popup03>
  <HLTIB0010Popup04 ref="hLTIB0010Popup04"></HLTIB0010Popup04>
  <HLTIB0010Popup05
    ref="hLTIB0010Popup05"
    @groupingSaved="() => onButtonsClick({ id: 'btnSearch' })"
  ></HLTIB0010Popup05>
  <ApprovalPopup ref="approvalPopup" @approvalClrLine="approvalRequest"></ApprovalPopup>
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
    min-height: 400px;
  }
}
</style>
