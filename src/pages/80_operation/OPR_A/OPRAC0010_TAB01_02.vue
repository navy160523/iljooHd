<!--
  화면명 : 안전요원 등록/관리 TAB 2
  화면개요 : 호선별 안전요원 등록/관리 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import { isEmpty } from 'lodash-es'
import { commonSearchApi, commonExecuteApi, commonLogExecuteApi, getCodeList, commonRequest } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import ILabel from '@/components/ILabel.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import ToDateCopy from '@/pages/80_operation/OPR_A/OPRAC0010Popup01.vue'
import BulkCreate from '@/pages/80_operation/OPR_A/OPRAC0010Popup04.vue'
import SetTeam from '@/pages/80_operation/OPR_A/OPRAC0010Popup03.vue'

// 변수 선언
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const grdSub = ref(null)
const grdEmp = ref(null)
const empPopup = ref(null)
const toDateCopy = ref(null)
const bulkCreate = ref(null)
const setTeam = ref(null)
const selectRow = ref(0)
const selectEmp = ref(false)
const selectDrag = ref(0)

const codeList = reactive({
  DEPT_CD: [],
  GWA_CD: [],
  TEAM_CD: [],
})

const allCodeList =  reactive({
  DEPT_CD: [],
  GWA_CD: [],
  TEAM_CD: [],
})

const subField = reactive([])

// combobox 리스트 조회
const getCode = () => {
  Promise.all([
       //commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: 'AN00', USE_DIV:'Y' } }), // 부서
       commonSearchApi({ queryId : 'SEARCH_DEPT_SAFE', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV:'Y' } }), // 부서
       commonSearchApi({ queryId : 'OPRAC0010_SEARCH_04', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV:'Y' } }), // 부서
       commonSearchApi({ queryId : 'OPRAC0010_SEARCH_05', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV:'Y' } }), // 부서
    ]).then(res => {
 
      var tempCodeList = []
      /*var orderList = ['조선안전부', '해양안전부', '엔진기계안전부', '특수선안전과', '자산안전/기획과', '안전경영부', '안전보건지원부' ]
      for(var i = 0; i < orderList.length; i++) {
        for(var j = 0; j < res[0].ORESULT_CUR.length; j++) {
          if(res[0].ORESULT_CUR[j].DEPT_NM.indexOf('안전') !== -1
            && res[0].ORESULT_CUR[j].BSNS_NM === '안전통합경영실' 
            && res[0].ORESULT_CUR[j].DEPT_NM == orderList[i]) {
            allCodeList.DEPT_CD.push(res[0].ORESULT_CUR[j])
            tempCodeList.push({DEPT_CD: res[0].ORESULT_CUR[j].DEPT_CD, DEPT_NM: res[0].ORESULT_CUR[j].DEPT_NM})
          }
        }
      }*/
    
      for(var j = 0; j < res[0].ORESULT_CUR.length; j++) {      
        tempCodeList.push({ DEPT_CD: res[0].ORESULT_CUR[j].DEPT_CD, DEPT_NM: res[0].ORESULT_CUR[j].DEPT_NM })      
      }

      grdMain.value.setBindingColumn('REL_DEPT_CD', tempCodeList, 'DEPT_CD', 'DEPT_NM')
      allCodeList.DEPT_CD = res[0].ORESULT_CUR
      allCodeList.GWA_CD = res[1].ORESULT_CUR
      allCodeList.TEAM_CD = res[2].ORESULT_CUR
      codeList.DEPT_CD = allCodeList.DEPT_CD
      // 처음에는 일단 모든 팀 다가져와서 보여준다.
      codeList.GWA_CD = allCodeList.GWA_CD
      codeList.TEAM_CD = allCodeList.TEAM_CD
      codeList.DEPT_CD.unshift({ DEPT_NM:'전체', DEPT_CD:'' })
      codeList.GWA_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
      codeList.TEAM_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })

      grdMain.value.getGridView().editOptions.movable = true
      grdEmp.value.getGridView().editOptions.movable = true

      setDept()

      getToday()
      onButtonsClick({ id:'btnSearch' })
  })
}

// 로그인 계정이 안전요원부서가 아닐 시에 안전부,안전과,안전팀을 전체로 한다.
const setDept = () => {
  for(var team of allCodeList.TEAM_CD) {
    if(team.ASGN_CD == userStore.asgnCd) {
      return
    }
  }
  searchParams.REL_DEPT_CD = ''
  searchParams.REL_GWA_CD = ''
  searchParams.REL_TEAM_CD = ''
}

/* 안전요원 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  WK_LPLC: '',     // 장소_L
  WK_MPLC: '',     // 장소_M
  WK_SPLC: '',     // 장소_S
  REL_DEPT_CD: userStore.deptCd, //  userStore.deptCd  안전부 
  REL_GWA_CD:  userStore.asgnCd.substring(0,4), // userStore.asgnCd.substring(0,4)  안전과
  REL_TEAM_CD: userStore.asgnCd, //'N1E11', userStore.asgnCd // 안전팀 (임시)
  REL_EMP_NM: '', // 안전요원
  REL_EMP_NO: '', // 안전요원 번호
  TMP_WK_DT: '',
  WK_DT: '',
})

/* 복사할 데이터 저장 */
const copyData = reactive([
  {
    WK_LPLC: '',        // 장소 L
    WK_MPLC: '',        // 장소 M
    WK_SPLC: '',        // 장소 S
    REL_DEPT_CD: '',    // 안전부
    REL_GWA_CD: '',    // 안전과
    REL_EMP_NO: '',     // 사번
    REL_EMP_NM: '',     // 안전요원이름
    HND_PHN: '',        // 휴대폰번호
    WK_DT: '',          // 근무일자
    REL_TEAM_CD: '',    // 안전팀
    TRS : '',           // 무전기코드
    LOC_HEADER_NO: '',    // 지역장
    LOC_HEADER_NM: '',    // 지역장이름
  }
])

// 교육실적 상세 그리드 셋팅
const grdSubProps = reactive({
  gridViewOption: { stateBar: { visible:false }, }, 
  fields : subField,
  columns: [],
})

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true } },
  keys : ['TMP_SHIP_NO'],
  fields : [ 
    { fieldName: 'SHIP_NO', sortable: false, dataType: 'text', header: { text: t('호선 코드') }, width : '80', visible: true, 
      'styleCallback': function(grid, dataCell){
        var ret = {styleName : 'middle_column', style: {background: undefined}}
        var data = grid.getValue(dataCell.index.itemIndex, 'EXCLUDE_WORK')
        if(data == '1') {
          ret.style.background = '#d8dff9'
        }
        return ret
      }
    },
    { fieldName: 'SHIP_NM', sortable: false, dataType: 'text', header: { text: t('호선명') }, styleName: 'left-column', width : '150', editable: false, 
      'styleCallback': function(grid, dataCell){
        var ret = {style: {background: undefined}}
        var data = grid.getValue(dataCell.index.itemIndex, 'EXCLUDE_WORK')
        if(data == '1') {
          ret.style.background = '#d8dff9'
        }
        return ret
      }
    },    
    { fieldName: 'REL_DEPT_NM', sortable: false, dataType: 'text', width: '80', header: { text: t('안전부') }, editable: false, visible: true },
    { fieldName: 'REL_GWA_NM', sortable: false, dataType: 'text', width: '80', header: { text: t('안전과') }, editable: false, visible: true },
    { fieldName: 'REL_TEAM_NM', sortable: false, dataType: 'text', width: '80', header: { text: t('안전팀') }, editable: false, visible: true },
    { fieldName: 'REL_EMP_NO', sortable: false, dataType: 'text', width: '60', header: { text: t('사번') }, editable: true,styleName: 'editable_column',
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background:undefined}}
        var data = grid.getValue(dataCell.index.itemIndex, 'REL_EMP_NO')

        if(grid.getValue(dataCell.index.itemIndex, 'EXCLUDE_WORK') == '1') {
          ret.style.background = undefined
          return ret
        } else if(data == null || data == '') ret.style.background = '#e98f8f'
        else ret.style.background = undefined
        return ret
      }
    },
    { fieldName: 'REL_EMP_NM', sortable: false, dataType: 'text', width: '60', header: { text: t('안전요원') }, editable: true,styleName: 'editable_column',
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
      'styleCallback': function(grid, dataCell){
        return setEditable(grid,dataCell)
      }
    },
    { fieldName: 'HND_PHN', sortable: false, dataType: 'text', width: '90', header: { text: t('휴대폰번호') }, editable: true,styleName: 'editable_column',
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background:undefined}}
        var data = grid.getValue(dataCell.index.itemIndex, 'REL_EMP_NO')

        if(grid.getValue(dataCell.index.itemIndex, 'EXCLUDE_WORK') == '1') {
          ret.style.background = undefined
          return ret
        } else if(data == null || data == '') ret.style.background = '#e98f8f'
        else ret.style.background = undefined
        return ret
      }
    },
    { fieldName: 'TEL_NO', sortable: false, dataType: 'text', width: '60', header: { text: t('내선번호') }, editable: true,styleName: 'editable_column',
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background:undefined}}
        var data = grid.getValue(dataCell.index.itemIndex, 'REL_EMP_NO')

        if(grid.getValue(dataCell.index.itemIndex, 'EXCLUDE_WORK') == '1') {
          ret.style.background = undefined
          return ret
        } else if(data == null || data == '') ret.style.background = '#e98f8f'
        else ret.style.background = undefined
        return ret
      }
    },
    { fieldName: 'TRS', sortable: false, dataType: 'text', width: '60', header: { text: t('무전기코드') }, editable: true, styleName: 'editable_column',
      'styleCallback': function(grid, dataCell){
        return setEditable(grid,dataCell)
      }
    },
    { fieldName: 'SHIP_HEADER_NO', sortable: false, dataType: 'boolean', width: '40', header: { text: t('호선장') }, editable: true, styleName: 'editable_column change_back_check', renderer: { type: "check" },
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'editable_column change_back_check', enabled: false, style: {background:undefined}}
        var data = grid.getValue(dataCell.index.itemIndex, 'REL_EMP_NO')

        if(grid.getValue(dataCell.index.itemIndex, 'EXCLUDE_WORK') == '1') {
          ret.style.background = undefined
          return ret
        } else if(data == null || data == '') ret.style.background = '#e98f8f'
        else ret.style.background = undefined
        return ret
      }
    },    
   
    { fieldName: 'UPDATE_USER_ID', sortable: false, width: '60', dataType: 'text', header: { text: t('수정자') }, editable: false,
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background:'#dfdfdf'}}

        if(grid.getValue(dataCell.index.itemIndex, 'EXCLUDE_WORK') == '1') {
          ret.style.background = undefined
          return ret
        } else if(grid.getValue(dataCell.index.itemIndex, 'REL_EMP_NO')== '' || grid.getValue(dataCell.index.itemIndex, 'REL_EMP_NO')== null) ret.style.background = '#e98f8f'
        else ret.style.background = undefined
        return ret
      }
    },
    { fieldName: 'UPDATE_DATE', sortable: false, width: '80', dataType: 'text', header: { text: t('수정일자') }, editable: false, 
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background:'#dfdfdf'}}

        if(grid.getValue(dataCell.index.itemIndex, 'EXCLUDE_WORK') == '1') {
          ret.style.background = undefined
          return ret
        } else if(grid.getValue(dataCell.index.itemIndex, 'REL_EMP_NO')== '' || grid.getValue(dataCell.index.itemIndex, 'REL_EMP_NO')== null) ret.style.background = '#e98f8f'
        else ret.style.background = undefined
        return ret
      }
    },
    { fieldName: 'ADD_EMP', sortable: false, width: '50', dataType: 'text', header: { text: t('요원추가') }, editable: false, styleName: 'cursor_pointer',
      renderer: {
        type: "image",
        imageCallback: function (grid, cell) {
          return getImg('AddBtn')
        },
        imageHeight: 20
      },
    },
    { fieldName: 'SUB_EMP', sortable: false, width: '50', dataType: 'text', header: { text: t('요원삭제') }, editable: false, styleName: 'cursor_pointer',
      renderer: {
        type: "image",
        imageCallback: function (grid, cell) {
          return getImg('SubBtn')
        },
        imageHeight: 20
      },
    },

    // 저장, 삭제시 필요 데이터
    { fieldName: 'WK_DT', dataType: 'datetime', width: '80', datetimeFormat: 'yyyy-MM-dd', header: { text: t('근무일자') }, visible:false, editable: true, styleName: 'editable_column',
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
      'styleCallback': function(grid, dataCell){
        return setEditable(grid,dataCell)
      }
    },
    { fieldName: 'REL_DEPT_CD', dataType: 'text', width: '80', header: { text: t('안전부') }, editable: false, visible: false,
      editor: { type: 'dropdown' }, lookupDisplay: true,
    },
    { fieldName: 'REL_GWA_CD', dataType: 'text', width: '80', header: { text: t('안전과') }, lookupDisplay: true, visible: false,
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background:undefined}}
        var dropList = { GWA_CD: [], GWA_NM: [] }
        
        for(let cd of allCodeList.GWA_CD) {
          if(grid.getValue(dataCell.index.itemIndex, 'REL_DEPT_CD') == cd.DEPT_CD) {
            dropList.GWA_CD.push(cd.ASGN_CD)
            dropList.GWA_NM.push(cd.ASGN_NM)
          }
        }
        ret.editor = {
          type: 'dropdown',
          values: dropList.GWA_CD,
          labels: dropList.GWA_NM,
          styleName : 'left-column', 
        }
        return ret
      },
      'displayCallback': function (grid, index, value) {
        var dropList = { GWA_CD: [], GWA_NM: [] }

        for(let cd of allCodeList.GWA_CD) {
          if(grid.getValue(index.itemIndex, 'REL_DEPT_CD') == cd.DEPT_CD) {
            dropList.GWA_CD.push(cd.ASGN_CD)
            dropList.GWA_NM.push(cd.ASGN_NM)
          }
        }
        var idx = dropList.GWA_CD.indexOf(value)
        var nmValue = dropList.GWA_NM[idx]
        return nmValue
      },  
    },
    { fieldName: 'REL_TEAM_CD', dataType: 'text', width: '80', header: { text: t('안전팀') }, styleName: '', editable: false, lookupDisplay: true, visible: false,
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background:undefined}}
        var dropList = { TEAM_CD: [], TEAM_NM: [] }
        for(let cd of allCodeList.TEAM_CD) {
          if(cd.ASGN_CD.indexOf(grid.getValue(dataCell.index.itemIndex, 'REL_GWA_CD')) !== -1) {
            dropList.TEAM_CD.push(cd.ASGN_CD)
            dropList.TEAM_NM.push(cd.ASGN_NM)
          } 
        }
        ret.editor = { 
          type: 'dropdown',
          values: dropList.TEAM_CD,
          labels: dropList.TEAM_NM,
          styleName : 'left-column', 
        }
        return ret
      },
      'displayCallback': function (grid, index, value) {
        var dropList = { TEAM_CD: [], TEAM_NM: [] }

        for(let cd of allCodeList.TEAM_CD) {
          
          if(cd.ASGN_CD.indexOf(grid.getValue(index.itemIndex, 'REL_GWA_CD')) !== -1) {
            dropList.TEAM_CD.push(cd.ASGN_CD)
            dropList.TEAM_NM.push(cd.ASGN_NM)
          }
        } 
        var idx = dropList.TEAM_CD.indexOf(value)
        var nmValue = dropList.TEAM_NM[idx]
        return nmValue
      },
    },
    { fieldName: 'INSERT_USER_ID', width: '60', dataType: 'text', header: { text: t('등록자') }, visible: false },
    { fieldName: 'INSERT_DATE', width: '80', dataType: 'text', header: { text: t('등록일자') }, visible: false },
    { fieldName: 'TMP_SHIP_NO', dataType: 'text', width: '120', header: { text: t('임시 호선 코드') }, styleName: 'left-column', width : '100', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('사업장구분') }, visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('EMP_NO') }, visible: false },
    { fieldName: 'IDX', dataType: 'text', header: { text: t('IDX') }, visible: false },
    { fieldName: 'WRITE_YN', dataType: 'text', header: { text: t('WRITE_YN') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') }, visible: false },
    { fieldName: 'EXCLUDE_WORK', dataType: 'text', header: { text: t('EXCLUDE_WORK') }, visible: false },
    { fieldName: 'NIGHT_YN', dataType: 'text', header: { text: t('NIGHT_YN') }, visible: false },
  ],
  columnLayout: [
    'SHIP_NO',
    'SHIP_NM',
    {
          name: '안전요원 정보',
          direction: 'horizontal',
          items: [ 'REL_DEPT_NM', 'REL_GWA_NM', 'REL_TEAM_NM', 'REL_EMP_NO', 'REL_EMP_NM', 'HND_PHN', 'TEL_NO', 'TRS', 'SHIP_HEADER_NO' ],
          header: { text: t('안전요원 정보') },
    },
    'UPDATE_USER_ID',
    'UPDATE_DATE',
    'ADD_EMP',
    'SUB_EMP',
  ],
  columns : [],
})

//그리드 속성셋팅_Emp
const grdEmpProps = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false } },
  keys : [],
  fields : [
    { fieldName: 'EMP_NO', sortable: false, dataType: 'text', header: { text: t('사번') },  },
    { fieldName: 'EMP_NM', sortable: false, dataType: 'text', header: { text: t('안전요원') }, editable: false },

    // 저장, 삭제시 필요 데이터
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('안전부') }, editable: false, styleName: 'left-column', visible: false},
    { fieldName: 'GWA_CD', dataType: 'text', header: { text: t('안전과') }, styleName: 'left-column', editable: false, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('안전팀') }, styleName: 'left-column', editable: false, visible: false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('안전부명') }, editable: false, styleName: 'left-column', visible: false},
    { fieldName: 'GWA_NM', dataType: 'text', header: { text: t('안전과명') }, editable: false, styleName: 'left-column', visible: false},
    { fieldName: 'ASGN_SHRT_NM', dataType: 'text', header: { text: t('안전팀명') }, styleName: 'left-column', editable: false, visible: false },
    { fieldName: 'HND_PHN', dataType: 'text', header: { text: t('휴대폰') }, editable: false, visible: false },
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('무전기코드') }, editable: false, visible: false },    
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('SAVE_YN') }, visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('USER_ID') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields
grdEmpProps.columns = grdEmpProps.fields

// ⭐ 이미지 가져오기
function getImg(name) {
  return new URL(`/src/assets/images/icons/${name}.png`, import.meta.url).href
}
 
// 셀 스타일 변경(편집가능)
const setEditable = (grid, dataCell) => {
  var ret = {editable : true, styleName : 'editable_column', enabled: false, style: {background:undefined}}
  var data = grid.getValue(dataCell.index.itemIndex, 'REL_EMP_NO')

  if(grid.getValue(dataCell.index.itemIndex, 'EXCLUDE_WORK') == '1') {
    ret.style.background = undefined
    return ret
  } else if(data == null || data == '') ret.style.background = '#e98f8f'
  else ret.style.background = undefined
  return ret
}

const parsingDate = (date) => {
  if(date == null) return ''
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2) // 월은 0부터 시작하므로 1을 더하고, 두 자리로 표현하기 위해 slice 사용
  var day = ('0' + date.getDate()).slice(-2) // 일도 두 자리로 표현하기 위해 slice 사용

  return '' + year + month + day
}

// 상단 버튼 클릭
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    if(searchParams.TMP_WK_DT == null) return Message.warn(t('근무일자를 입력해주십시오.'))
    searchData()
    searchSubData()
    searchEmpData()
  } else if (btn.id === 'btnCopy') {
    let currentRowIdx = grdMain.value.getGridView().getCurrent().dataRow
    const selectData = grdMain.value.getDataProvider().getJsonRow(currentRowIdx)

    let newRow ={
      CMPNY_DIV: userStore.cmpnyDiv,
      REL_DEPT_CD: copyData[0].REL_DEPT_CD,
      REL_GWA_CD: copyData[0].REL_GWA_CD,
      REL_TEAM_CD: copyData[0].REL_TEAM_CD,
      REL_EMP_NO: copyData[0].REL_EMP_NO,
      REL_EMP_NM: copyData[0].REL_EMP_NM,
      TRS: copyData[0].TRS,
      LOC_HEADER_NO: copyData[0].LOC_HEADER_NO,
      WK_DT: searchParams.TMP_WK_DT,
      USER_ID: userStore.userId,
      SAVE_YN: '',
      IDX: '',
      WRITE_YN: 'Y',
    }

    Message.success(t('성공적으로 복사되었습니다.'))
  } else if (btn.id == 'btnCreate'){
    let currentRowIdx = grdMain.value.getGridView().getCurrent().dataRow
    let parentRow = grdMain.value.getDataProvider().getParent(currentRowIdx)
    const selectData = grdMain.value.getDataProvider().getJsonRow(currentRowIdx)
    const parentData = grdMain.value.getDataProvider().getJsonRow(parentRow)
    let newRow ={
      CMPNY_DIV: userStore.cmpnyDiv,
      REL_DEPT_CD: searchParams.REL_DEPT_CD,
      REL_GWA_CD: searchParams.REL_GWA_CD,
      REL_TEAM_CD: searchParams.REL_TEAM_CD,
      REL_EMP_NO: '',
      REL_EMP_NM: '',
      TRS: '',
      LOC_HEADER_NO: '',
      WK_DT: searchParams.TMP_WK_DT,
      SHIP_NO: selectData.SHIP_NO,
      USER_ID: userStore.userId,
      SAVE_YN: '',
      IDX: '',
      WRITE_YN: 'Y',
    }

    let gridView = grdMain.value.getGridView()
    let getTreeData = grdMain.value.getDataProvider()
    
    if (selectData.SHIP_NM == null || selectData.SHIP_NM  == '') {
      let addRowIdx = getTreeData.addChildRow(getTreeData.getParent(currentRowIdx), newRow, null, false)
      grdMain.value.getGridView().setCurrent({ dataRow: addRowIdx, column: 'SHIP_NO' })
      gridView.checkRow(addRowIdx, true, false, false)
    } else { // 3레벨
      let addRowIdx = getTreeData.addChildRow(currentRowIdx, newRow, null, false)
      grdMain.value.getGridView().setCurrent({ dataRow: addRowIdx, column: 'SHIP_NO' })
      gridView.checkRow(addRowIdx, true, false, false)
    }
    
    reRendering()
  } else if (btn.id === 'btnBulkCreate') {
    bulkCreate.value.openPopup(searchParams)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
    .setTargetGridRow([{ grid:grdMain, row: 'check' }])
    .setGridList([grdMain])
    .setConfirmMessage('삭제시 데이터 베이스에서도 바로 삭제됩니다. 진행하시겠습니까?')
    .setQuery(deleteMainData)
    .setAfter(afterCloseDelete)
    .run()
  } else if (btn.id === 'btnToDateCopy') {
    if(isEmpty(searchParams.REL_GWA_CD)) {
      return Message.err(t('안전과를 선택해주십시오.'))
    } else if(isEmpty(searchParams.REL_TEAM_CD)) {
      return Message.err(t('안전팀을 선택해주십시오.'))
    }
    toDateCopy.value.openPopup(searchParams, 2)
  } else if (btn.id === 'btnAddEmp') { // 요원추가
    addEmp()
  } else if (btn.id === 'btnReset') {
    new deleteFlowHelper(vm, t)
    .setConfirmMessage(searchParams.TMP_WK_DT + '일자의 데이터를 초기화합니다. 진행하시겠습니까?')
    .setQuery(resetMainData)
    .setAfter(afterClosereset)
    .run()
  } else if (btn.id == 'btnSetTeam') {
    setTeam.value.openPopup()
  }
} 

const addEmp = async () => {
  const empRow = grdEmp.value.getGridView().getCurrent().dataRow
  let currentRowIdx = grdMain.value.getGridView().getCurrent().dataRow
  const selectData = grdMain.value.getDataProvider().getJsonRow(currentRowIdx)
  let gridView = grdMain.value.getGridView()
  let getTreeData = grdMain.value.getDataProvider()

  if(empRow < 0) return Message.warn(t('추가할 요원을 선택해주십시오.'))
  let newRow ={
    CMPNY_DIV: userStore.cmpnyDiv,
    REL_DEPT_CD: grdEmp.value.getGridView().getValue(empRow, 'DEPT_CD'),
    REL_GWA_CD: grdEmp.value.getGridView().getValue(empRow, 'ASGN_CD').substring(0,4),
    REL_TEAM_CD: grdEmp.value.getGridView().getValue(empRow, 'ASGN_CD'),
    REL_DEPT_NM: grdEmp.value.getGridView().getValue(empRow, 'DEPT_NM'),
    REL_GWA_NM: grdEmp.value.getGridView().getValue(empRow, 'GWA_NM'),
    REL_TEAM_NM: grdEmp.value.getGridView().getValue(empRow, 'ASGN_SHRT_NM'),
    REL_EMP_NO: grdEmp.value.getGridView().getValue(empRow, 'EMP_NO'),
    REL_EMP_NM: grdEmp.value.getGridView().getValue(empRow, 'EMP_NM'),
    HND_PHN: grdEmp.value.getGridView().getValue(empRow, 'HND_PHN'),
    TEL_NO: grdEmp.value.getGridView().getValue(empRow, 'TEL_NO'),
    TRS: '',
    SHIP_NO: selectData.SHIP_NO,
    LOC_HEADER_NO: '',
    WK_DT: searchParams.TMP_WK_DT,
    USER_ID: userStore.userId,
    IDX: '',
    WRITE_YN: 'Y',
  }
  // newRow.REL_DEPT_NM = await getCodeNm(newRow.REL_DEPT_CD)
  // newRow.REL_GWA_NM = await getCodeNm(newRow.REL_GWA_CD)
  // newRow.REL_TEAM_NM = await getCodeNm(newRow.REL_TEAM_CD)
  if (selectData.REL_EMP_NO === newRow.REL_EMP_NO) return
  if (selectData.REL_EMP_NO == null || selectData.REL_EMP_NO == '') { // 최하위 레벨
    grdMain.value.getDataProvider().setValue(currentRowIdx,'WRITE_YN', 'Y')
    grdMain.value.getDataProvider().setValue(currentRowIdx,'CMPNY_DIV', newRow.CMPNY_DIV)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_DEPT_CD', newRow.REL_DEPT_CD)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_GWA_CD', newRow.REL_GWA_CD)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_TEAM_CD', newRow.REL_TEAM_CD)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_DEPT_NM', newRow.REL_DEPT_NM)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_GWA_NM', newRow.REL_GWA_NM)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_TEAM_NM', newRow.REL_TEAM_NM)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_EMP_NO', newRow.REL_EMP_NO)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_EMP_NM', newRow.REL_EMP_NM)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'TRS', '')
    grdMain.value.getDataProvider().setValue(currentRowIdx,'HND_PHN', newRow.HND_PHN)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'TEL_NO', newRow.TEL_NO)
    grdMain.value.getDataProvider().setValue(currentRowIdx,'WK_DT', searchParams.TMP_WK_DT)
    gridView.checkRow(currentRowIdx, true, false, false)
  } else if(selectData.SHIP_NM == null) {
    if(!checkDup(selectData.SHIP_NO, newRow.REL_EMP_NO)) return
    let addRowIdx = getTreeData.addChildRow(getTreeData.getParent(currentRowIdx), newRow, null, false)
    grdMain.value.getGridView().setCurrent({ dataRow: addRowIdx, column: 'SHIP_NO' })
    gridView.checkRow(addRowIdx, true, false, false)
  } else { // 3레벨
    if(!checkDup(selectData.SHIP_NO, newRow.REL_EMP_NO)) return
    let addRowIdx = getTreeData.addChildRow(currentRowIdx, newRow, null, false)
    grdMain.value.getGridView().setCurrent({ dataRow: addRowIdx, column: 'SHIP_NO' })
    gridView.checkRow(addRowIdx, true, false, false)
  }
  reRendering()
}

// 안전부,안전과,안전팀명 조회
const getCodeNm = async (code) => {
  try {
    const res = await commonSearchApi({ queryId: 'OPRAC0010_SEARCH_12', param: { CMPNY_DIV: userStore.cmpnyDiv, CODE: code } })
    return res.ORESULT_CUR[0].NAME
  } catch (error) {
    console.error("Error fetching code name:", error)
    throw error;  // 필요한 경우 에러를 다시 던질 수 있습니다.
  }
}

// 중복 체크
const checkDup = (shipNo, empNo) => {
  for(var i = 1; i <= grdMain.value.getDataProvider().getRowCount(); i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    if(data == null) return false
    if(data.SHIP_NO == shipNo && data.REL_EMP_NO == empNo) return false
  }
  return true
}

const reRendering = () => {
  // 재 렌더링을 해주기 위한 코드(렌더링이 되지 않으면 데이터가 변하지 않은 거처럼 보임)
  grdMain.value.getGridView().displayOptions.rowHeight = grdMain.value.getGridView().displayOptions.rowHeight + 1
  grdMain.value.getGridView().displayOptions.rowHeight = grdMain.value.getGridView().displayOptions.rowHeight - 1
}

const setSubGrd = () => {
  const [year, month] = searchParams.TMP_WK_DT.split('-').map(Number)
  const days = new Date(year, month, 0).getDate()
  
  subField.value = [{ fieldName: 'GBN', dataType: 'text', header: { text: t('구분') }, editable: false }]
  for(var i = 1; i <= days; i++) {
    const fieldNm = '' + i
    subField.value.push({ fieldName: fieldNm, dataType: 'text', header: { text: t(i + '일') }, editable: false, width: 30, styleName: 'cursor_pointer',
      'styleCallback': function(grid, dataCell){ 
        var ret =  {style: {background:undefined}}
        if(dataCell.index.itemIndex == 1 && parseInt(searchParams.TMP_WK_DT.substring(8,10)) == parseInt(fieldNm)) {
          ret.style.background = '#4fff5e'
        } else if(grid.getValue(dataCell.index.itemIndex, fieldNm) !== 'X') {
          return ret
        } else {
          ret.style.background = '#e13030'
        }
        return ret
      }
    })
  }
  
  grdSub.value.getDataProvider().setFields(subField.value)
  grdSub.value.getGridView().setColumns(subField.value)
}

//DB 삭제
const deleteMainData = () => {
  let deleteRows = grdMain.value.getGridView().getCheckedRows(true)
  if(deleteRows.length === 0) return

  let deleteList = []
  for(let i = 0; i < deleteRows.length; i++){
    let grdJsonRow = grdMain.value.getDataProvider().getJsonRow(deleteRows[i])
    grdJsonRow.CMPNY_DIV = userStore.cmpnyDiv
    deleteList.push(grdJsonRow)
  }  
  return commonExecuteApi({ queryId : 'OPRAC0010_DELETE_03', list: deleteList })
}

//삭제 후 그리드 삭제
const afterCloseDelete = res => {
  new queryFlowHelper(vm, t)
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()

  searchSubData()
  searchEmpData()
  return Message.success(t('정상적으로 삭제 되었습니다.'))
}

//DB 삭제
const resetMainData = () => {
  let deleteList = []
  let param = { CMPNY_DIV: userStore.cmpnyDiv, USER_ID : userStore.userId, WK_DT: '',  REL_TEAM_CD: '' }
  param.WK_DT = searchParams.TMP_WK_DT.substring(0,4) + searchParams.TMP_WK_DT.substring(5,7) + searchParams.TMP_WK_DT.substring(8,10)
  if(!isEmpty(searchParams.REL_TEAM_CD)) {
    param.REL_TEAM_CD = searchParams.REL_TEAM_CD
  } else if(!isEmpty(searchParams.REL_GWA_CD)) {
    param.REL_TEAM_CD = searchParams.REL_GWA_CD
  } else if(!isEmpty(searchParams.REL_DEPT_CD)) {
    param.REL_TEAM_CD = searchParams.REL_DEPT_CD
  }
  deleteList.push(param)
  return commonExecuteApi({ queryId : 'OPRAC0010_DELETE_04', list: deleteList })
}

//삭제 후 그리드 삭제
const afterClosereset = res => {
  new queryFlowHelper(vm, t)
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
  searchSubData()
  searchEmpData()
  return Message.success(t('정상적으로 초기화 되었습니다.'))
}

// 저장 전
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(checkedRows.length == 0) return Message.warn(t('데이터를 선택해 주십시오.'))
  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.REL_EMP_NO == '' || data.WK_DT == '' || data.REL_EMP_NO == null || data.WK_DT == null) continue
    data.WK_DT = parsingDate(data.WK_DT)
    data.USER_ID = userStore.userId
    if(data.CMPNY_DIV == null) data.CMPNY_DIV = userStore.cmpnyDiv
    if(data.SHIP_NO == '' || data.SHIP_NO == null) data.SHIP_NO = data.TMP_SHIP_NO
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'OPRAC0010_SAVE_07', list: saveParams })
}

// 안전요원 검색 팝업에서 선택시
const selectedemp = (row) => {
  // 상단 검색
  if(!selectEmp.value) {
    searchParams.REL_EMP_NM = row.EMP_NM;
    searchParams.REL_EMP_NO = row.EMP_NO;
  } else { // 그리드에서 검색
    setEmp(row)
  }
}

const setEmp = async (row) => {
  let currentRowIdx = grdMain.value.getGridView().getCurrent().dataRow
  let deptNm = await getCodeNm(row.DEPT_CD)
  let gwaNm = await getCodeNm(row.ASGN_CD.substring(0,4))
  let teamNm = await getCodeNm(row.ASGN_CD)

  grdMain.value.getDataProvider().setValue(currentRowIdx, 'CMPNY_DIV', row.CMPNY_DIV)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'REL_DEPT_CD', row.DEPT_CD)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'REL_GWA_CD', row.ASGN_CD.substring(0,4))
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'REL_TEAM_CD', row.ASGN_CD)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'REL_DEPT_NM', deptNm)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'REL_GWA_NM', gwaNm)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'REL_TEAM_NM', teamNm)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'REL_EMP_NO', row.EMP_NO)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'REL_EMP_NM', row.EMP_NM)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'TRS', '')
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'HND_PHN', row.HND_PHN)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'TEL_NO', row.TEL_NO)
  grdMain.value.getDataProvider().setValue(currentRowIdx, 'WK_DT', searchParams.TMP_WK_DT)
  grdMain.value.getGridView().checkRow(currentRowIdx, true, false, false)
  selectEmp.value = false

  // 재 렌더링을 해주기 위한 코드(렌더링이 되지 않으면 데이터가 변하지 않은 거처럼 보임)
  reRendering()
}

// 현재 날짜 자동 입력 
const getToday = () => {
  // 현재 날짜 객체 생성
  var today = new Date()
  // 년, 월, 일을 가져오기
  var year = today.getFullYear()
  // 월은 0부터 시작하기 때문에 1을 더해줌
  var month = (today.getMonth() + 1).toString().padStart(2, '0') // 1자리 숫자는 앞에 0을 붙여 두 자리로 만듦
  var day = today.getDate().toString().padStart(2, '0') // 위와 동일
  searchParams.TMP_WK_DT = year + '-' + month + '-' + day
}

//DB 조회
const searchMainData = () => {  
  searchParams.WK_DT = parsingDate(new Date(searchParams.TMP_WK_DT))
  return commonSearchApi({ queryId : 'OPRAC0010_SEARCH_08', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.setBindingColumn('REL_DEPT_CD', codeList.DEPT_CD, 'DEPT_CD', 'DEPT_NM')
  grdMain.value.setBindingColumn('REL_GWA_CD', allCodeList.GWA_CD, 'ASGN_CD', 'ASGN_NM')
  grdMain.value.setBindingColumn('REL_TEAM_CD', allCodeList.TEAM_CD, 'ASGN_CD', 'ASGN_NM')
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR, 'TMP_SHIP_NO')
  grdMain.value.getGridView().expandAll()

  // 개인정보 조회 로그 남기기
  let params = {
    userStore: userStore,
    params: searchParams,
    mgs: '[안전 담당구역 등록/관리] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

//조회 함수
const searchData = () =>{  
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
}

//DB 조회
const searchSub = () => {  
  let subSearchParam = {}
  subSearchParam.WK_DT = parsingDate(new Date(searchParams.TMP_WK_DT)).substring(0,6) + '01'
  subSearchParam.REL_DEPT_CD = searchParams.REL_DEPT_CD
  subSearchParam.REL_GWA_CD = searchParams.REL_GWA_CD
  subSearchParam.REL_TEAM_CD = searchParams.REL_TEAM_CD
  // if(searchParams.REL_TEAM_CD != null && searchParams.REL_TEAM_CD != '') subSearchParam.REL_TEAM_CD = searchParams.REL_TEAM_CD
  // else if(searchParams.REL_GWA_CD != null && searchParams.REL_GWA_CD != '') subSearchParam.REL_TEAM_CD = searchParams.REL_GWA_CD
  return commonSearchApi({ queryId : 'OPRAC0010_SEARCH_09', param: subSearchParam })
} 

//조회 후 반영
const afterSubSearch = res =>{
  let result = []
  let addResult = {'GBN':'안전장소 배정완료 여부'}
  for(var k of Object.keys(res.ORESULT_CUR[0])) {
    if(k === 'GBN') continue
    if(res.ORESULT_CUR[0][k] > 0) addResult[k] = 'X'
    else addResult[k] = 'O'
  }

  result.push(addResult)
  result.push(res.ORESULT_CUR[0])
  grdSub.value.getDataProvider().setRows(result)
}

//조회 함수
const searchSubData = () =>{
  setSubGrd()
  new queryFlowHelper(vm, t)
    .setQuery(searchSub)
    .setAfter(afterSubSearch)
    .run()
}

//DB 조회
const searchEmp = () => {  
  let searchEmpParam = { 
    CMPNY_DIV: 'HHI',
    REL_DEPT_CD: searchParams.REL_DEPT_CD,
    REL_GWA_CD: searchParams.REL_GWA_CD,
    REL_TEAM_CD: searchParams.REL_TEAM_CD,
    RETI_DATE: searchParams.TMP_WK_DT.replaceAll('-','')
  }
  return commonSearchApi({ queryId : 'OPRAC0010_SEARCH_13', param: searchEmpParam })
}

//조회 후 반영
const afterEmpSearch = res =>{
  grdEmp.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//조회 함수
const searchEmpData = () =>{
  if(searchParams.REL_DEPT_CD == '' && searchParams.REL_TEAM_CD == '' && searchParams.REL_GWA_CD == '') {
    grdEmp.value.getDataProvider().setRows([])
    return
  }
  new queryFlowHelper(vm, t)
    .setGridList([grdEmp])
    .setQuery(searchEmp)
    .setAfter(afterEmpSearch)
    .run()
}

// 인원검색 팝업
const empPopupOpen = () => {
  empPopup.value.openPopup({ EMP_NM: searchParams.REL_EMP_NM });
}
 
// 요원 삭제
const deleteMan = () => {
  let currentRowIdx = grdMain.value.getGridView().getCurrent().dataRow
  const selectData = grdMain.value.getDataProvider().getJsonRow(currentRowIdx)
  
  if(selectData.SHIP_NM == null || selectData.SHIP_NM == '') {
    let deleteList = []
    deleteList.push(selectData)
    if(selectData.IDX != null && selectData.IDX != '') commonExecuteApi({ queryId : 'OPRAC0010_DELETE_03', list: deleteList })
    grdMain.value.getDataProvider().removeRow(currentRowIdx)
  } else {
    grdMain.value.getDataProvider().setValue(currentRowIdx,'WRITE_YN', '')
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_DEPT_CD', '')
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_GWA_CD', '')
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_DEPT_NM', '')
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_GWA_NM', '')
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_TEAM_NM', '')
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_EMP_NO', '')
    grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_EMP_NM', '')
    grdMain.value.getDataProvider().setValue(currentRowIdx,'TRS', '')

    let deleteList = []
    deleteList.push(selectData)
    if(selectData.IDX != null && selectData.IDX != '')  {
      commonExecuteApi({ queryId : 'OPRAC0010_DELETE_03', list: deleteList }).then(res => {
      })
    } 
    
    changeDeleteRow(selectData.SHIP_NO, currentRowIdx)
  }
  reRendering()
}

// 부모노드에 위치한 요원은 삭제되지만 자식노드에 있는 요원이 있을 시 자리 바꿈
const changeDeleteRow = (shipNo, currentRowIdx) => {
  for(var i = 1; i <= grdMain.value.getDataProvider().getRowCount(); i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)
    if(data == null) continue
    if(data.SHIP_NO == shipNo && (data.REL_EMP_NO != '' && data.REL_EMP_NO != null) && data.WRITE_YN == 'Y') {
      grdMain.value.getDataProvider().setValue(currentRowIdx,'WRITE_YN', 'Y')
      grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_DEPT_CD', data.REL_DEPT_CD)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_GWA_CD', data.REL_GWA_CD)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_EMP_NO', data.REL_EMP_NO)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_EMP_NM', data.REL_EMP_NM)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_TEAM_CD', data.REL_TEAM_CD)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_DEPT_NM', data.REL_DEPT_NM)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_GWA_NM', data.REL_GWA_NM)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'REL_TEAM_NM', data.REL_TEAM_NM)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'IDX', data.IDX)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'WK_DT', data.WK_DT)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'UPDATE_USER_ID', data.UPDATE_USER_ID)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'UPDATE_DATE', data.UPDATE_DATE)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'SHIP_HEADER_NO', data.LOC_HEADER_NO)
      grdMain.value.getDataProvider().setValue(currentRowIdx,'TRS', data.TRS)
      grdMain.value.getDataProvider().setValue(i,'REL_EMP_NO', '')
      grdMain.value.getDataProvider().setValue(i,'WRITE_YN', 'N')
      grdMain.value.getDataProvider().removeRow(i)
      return 
    }
  }
}

//트리 값 변경 이벤트
const editRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) =>{
  let changedRow = grdMain.value.getDataProvider().getJsonRow(dataRow)
  if(field === 0 && changedRow.SAVE_YN === 'Y'){
    Message.warn(t('이미 저장된 코드는 수정할 수 없습니다.'))
    
    grdMain.value.getDataProvider().setValue(dataRow, 'SYS_CD', oldValue)
  }
  else if(field === 0 && changedRow.SAVE_YN != 'Y'){
    grdMain.value.getGridView().commit()
    grdMain.value.getDataProvider().setValue(dataRow, 'ALL_SYS_CD', changedRow.ALL_SYS_CD + newValue)
  }
}


// Main 그리드 클릭 시 복사 데이터 준비
const onCellClicked = (grid, clickData) => {
  if (clickData.dataRow == null) return

  selectDrag.value = clickData.dataRow
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  
  if(clickData.fieldName === 'ADD_EMP') {
    onButtonsClick({ id:'btnAddEmp' })
  } else if(clickData.fieldName === 'SUB_EMP') {
    deleteMan()
  } else if (clickData.fieldName === 'REL_EMP_NM') {
    let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    empPopup.value.openPopup({ EMP_NM: ''});
    selectEmp.value = true
    selectRow.value = clickData.itemIndex + 1
  }

  for (var key in data) {
    if(copyData[0].hasOwnProperty(key)) copyData[0][key] = data[key]
  }
}

// 월간 조회현황 클릭 
const onSubCellClicked = (grid, clickData) => {  
  let day = clickData.fieldName
  if(day == 'GBN') return
  if(day < 10) day = '0' + day
  searchParams.TMP_WK_DT = searchParams.TMP_WK_DT.substring(0,8) + day
  new queryFlowHelper(vm, t)
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .run()
  searchSubData()
  searchEmpData()
}

// 안전부 변경 시 부서 변경 이벤트
watch(() => searchParams.REL_DEPT_CD, (newValue, oldValue) => {
  if(searchParams.REL_DEPT_CD === '') {
    searchParams.REL_GWA_CD = ''
    searchParams.REL_TEAM_CD = ''
  }
  
  commonSearchApi({ queryId : 'OPRAC0010_SEARCH_04', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: searchParams.REL_DEPT_CD, USE_DIV:'Y' } })
  .then(res => {
    codeList.GWA_CD = res.ORESULT_CUR
    codeList.GWA_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
    if (newValue !== oldValue) {
      searchParams.REL_GWA_CD = codeList.GWA_CD[0].ASGN_CD
    }
  })
})

// 안전과 바뀌면 안전팀 데이터 가져옴
watch(() => searchParams.REL_GWA_CD, (newValue, oldValue) => {
  searchParams.REL_TEAM_CD = ''
  commonSearchApi({ queryId : 'OPRAC0010_SEARCH_05', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', ASGN_CD: searchParams.REL_GWA_CD } })
    .then(res => {
      codeList.TEAM_CD = res.ORESULT_CUR
      if(codeList.TEAM_CD.length == 1) {
        searchParams.REL_TEAM_CD = res.ORESULT_CUR[0].ASGN_CD
        codeList.TEAM_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
        return
      }
      codeList.TEAM_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
      if (codeList.TEAM_CD.length !== 0) {
        searchParams.TEAM_CD = ''
      }
    })
})

defineExpose({
  onButtonsClick,
})

onMounted(() => {
  getCode()
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex flex-column mb-0">
          <!-- 근무일자, 안전부, 안전과, 안전팀, 안전요원 -->
          <div class="d-flex">
            <ILabel :label="$t('근무일자')"> 
              <template #editor>
                <VTextField
                  v-model="searchParams.TMP_WK_DT"
                  type="date" 
                  style="width: 200px" 
                />
              </template> 
            </ILabel>
            <i-select
              :label="$t('안전부')"
              v-model="searchParams.REL_DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM" 
              width="250px"  
            />
            <i-select 
              :label="$t('안전과')"
              v-model="searchParams.REL_GWA_CD"
              :disabled="searchParams.REL_DEPT_CD === '' ? true : false"
              :items="codeList.GWA_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM" 
              width="250px" 
            />
            <i-select 
              :label="$t('안전팀')"
              v-model="searchParams.REL_TEAM_CD"
              :disabled="searchParams.REL_GWA_CD === '' ? true : false"
              :items="codeList.TEAM_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM" 
              width="250px" 
            />
            <ILabel 
              :label="$t('안전요원')"
              class="w-25"
            >
              <template #editor>
                <v-text-field
                  v-model="searchParams.REL_EMP_NM"
                  type="text"
                  variant="solo"
                  flat
                  class="mr-2"
                  width="250px"
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="empPopupOpen"
                  @keypress.enter="empPopupOpen"
                />
              </template>
            </ILabel>
          </div>
        </v-sheet>
        <v-sheet height="141px" class="mb-2"> 
          <IGridTitle 
              :title="$t('월간 조회 현황')"
            >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdSub"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys"
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            @onCellClicked="onSubCellClicked"
          />
        </v-sheet>
        <div class="h-grow">
          <v-sheet class="h-auto mr-2" width="85%">
            <IGridTitle 
                :title="$t('안전요원 배치 현황')"
              >
              <template #editors />
            </IGridTitle>
            <RealGrid 
              ref="grdMain" 
              is-tree
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @on-edit-row-changed="editRowChanged"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
          <v-sheet class="h-auto" width="15%">
            <IGridTitle 
                :title="$t('안전요원 목록')"
              >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdEmp"
              :grid-view-option="grdEmpProps.gridViewOption"
              :keys="grdEmpProps.keys"
              :fields="grdEmpProps.fields"
              :columns="grdEmpProps.columns"
            />
          </v-sheet>
        </div>
      </div>
      <EmpPopup ref="empPopup" @selected="selectedemp" />
      <ToDateCopy ref="toDateCopy" @after-search="() => onButtonsClick({ id: 'btnSearch' })"/>
      <BulkCreate ref="bulkCreate" @after-search="() => onButtonsClick({ id: 'btnSearch' })"/>
      <SetTeam ref="setTeam" @after-search="() => onButtonsClick({ id: 'btnSearch' })"/>
    </v-card-text>
  </v-card> 
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px - 145px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

</style>
