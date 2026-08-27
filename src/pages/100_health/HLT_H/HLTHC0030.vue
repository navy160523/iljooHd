<!--
    화면명 : 도수보안경 시력검사결과
    화면개요 : 도수보안경 시력검사결과
    작성자 : 김동건
    작성일자 : 2025-07-02
-->
<script setup>
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  getCompanyList,
  commonRequest2,
} from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance, computed, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { getJsonFromExcel } from '@/utils/excel'
import { isEmpty } from '@/@core/utils'
import { useCommonStore } from '@hiway/stores/common'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const isAdmin = ref(0)
const ready = ref(false)
const grdMain = ref(null)
const commonStore = useCommonStore()
const dateAllInput = ref(null) //일자일괄입력
defineOptions({
  name: '100_health-HLT_H-HLTHC0030',
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: new Date().getFullYear(),
  REQ_CHA: (new Date().getMonth() + 1).toString(),
  BSNS_CD: '',
  REQ_DIV: 'A',
  DEPT_CD: '',
  USER_DIV: '%',
})

const codeList = reactive({
  REQ_CHA: [],
  USER_DIV: [
    { COD: '%', TXT: '전체', DISABLE: false },
    { COD: 'A', TXT: '직영', DISABLE: false },
    { COD: 'B', TXT: '사내협력사', DISABLE: false },
  ],
  BSNS_CD: [],
  DEPT_CD: [],
  RESULT: [
    { COD: 'Y', TXT: '지급', DISABLE: false },
    { COD: 'N', TXT: '시력기준미달', DISABLE: false },
  ],
  GLASSES: [],
})

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
  },
  fields: [
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      lookupDisplay: true,
      header: { text: t('부서') },
      styleName: 'left-column',
    },
    {
      fieldName: 'USER_DIV',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('구분') },
      lookupDisplay: true,
      styleName: 'center-column',
    },
    {
      fieldName: 'TEAM_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('팀') },
      styleName: 'left-column',
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('사번') },
      styleName: 'center-column',
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('이름') },
      styleName: 'center-column',
    },
    {
      fieldName: 'REQUEST_YN',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('신청여부') },
      styleName: 'center-column',
    },
    {
      fieldName: 'READ_LEFT',
      dataType: 'text',
      width: '60',
      editable: false,
      lookupDisplay: true,
      header: { text: t('좌') },
      styleName: 'center-column',
    },
    {
      fieldName: 'READ_RIGHT',
      dataType: 'text',
      width: '60',
      editable: false,
      lookupDisplay: true,
      header: { text: t('우') },
      styleName: 'center-column',
    },
    {
      fieldName: 'SPHD_LEFT',
      dataType: 'text',
      width: '60',
      editable: false,
      lookupDisplay: true,
      header: { text: t('좌') },
      styleName: 'center-column',
    },
    {
      fieldName: 'SPHD_RIGHT',
      dataType: 'text',
      width: '60',
      editable: false,
      lookupDisplay: true,
      header: { text: t('우') },
      styleName: 'center-column',
    },
    {
      fieldName: 'CYLD_LEFT',
      dataType: 'text',
      width: '60',
      editable: false,
      lookupDisplay: true,
      header: { text: t('좌') },
      styleName: 'center-column',
    },
    {
      fieldName: 'CYLD_RIGHT',
      dataType: 'text',
      width: '60',
      editable: false,
      lookupDisplay: true,
      header: { text: t('우') },
      styleName: 'center-column',
    },
    {
      fieldName: 'AXIS_LEFT',
      dataType: 'text',
      width: '60',
      editable: false,
      lookupDisplay: true,
      header: { text: t('좌') },
      styleName: 'center-column',
    },
    {
      fieldName: 'AXIS_RIGHT',
      dataType: 'text',
      width: '60',
      editable: false,
      lookupDisplay: true,
      header: { text: t('우') },
      styleName: 'center-column',
    },
    {
      fieldName: 'EYESIGHT_ADD',
      dataType: 'text',
      width: '70',
      editable: false,
      lookupDisplay: true,
      header: { text: t('ADD') },
      styleName: 'left-column',
    },
    {
      fieldName: 'PD',
      dataType: 'text',
      width: '100',
      editable: false,
      lookupDisplay: true,
      header: { text: t('PD') },
      styleName: 'left-column',
    },
    {
      fieldName: 'FRAME',
      dataType: 'text',
      width: '100',
      editable: true,
      lookupDisplay: true,
      header: { text: t('FRAME') },
      styleName: 'left-column editable_column',
      styleCallback: function (grid, dataCell) {
        var ret = {}
        // if (
        //   grid.getValue(dataCell.index.itemIndex, "DUTY_YN") === "N" ||
        //   grid.getValue(dataCell.index.itemIndex, "STATUS") === "4" ||
        //   grid.getValue(dataCell.index.itemIndex, "STATUS") === "9"
        // ) {
        //   ret.editable = false;
        // }
        return ret
      },
    },
    {
      fieldName: 'SHADE_CLIP',
      dataType: 'text',
      width: '100',
      editable: false,
      lookupDisplay: true,
      header: { text: t('차광클립') },
      styleName: 'left-column',
    },
    {
      fieldName: 'LENS',
      dataType: 'text',
      width: '80',
      editable: false,
      lookupDisplay: true,
      header: { text: t('렌즈') },
      styleName: 'center-column',
    },
    {
      fieldName: 'RESULT',
      dataType: 'text',
      width: '80',
      editable: false,
      lookupDisplay: true,
      header: { text: t('판정') },
      styleName: 'center-column',
    },
    {
      fieldName: 'RECEIVE_DT',
      dataType: 'text',
      datetimeFormat: 'yyyy-MM-dd',
      width: '100',
      styleName: 'editable_column',
      header: { text: t('지급일자') },
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        textReadOnly: true,
        mask: {
          editMask: '9999-99-99',
          includedFormat: true,
        },
      },
      styleCallback: function (grid, dataCell) {
        var ret = {};
        if (
          grid.getValue(dataCell.index.itemIndex, "RESULT") === "Y" &&
          grid.getValue(dataCell.index.itemIndex, "FRAME") != "" &&
          grid.getValue(dataCell.index.itemIndex, "FRAME") != null
        ) {
          ret.editable = true;
        }else{
          ret.editable = false;
        }
        return ret;
      },
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      width: '80',
      editable: false,
      lookupDisplay: true,
      header: { text: t('비고') },
      styleName: 'left-column',
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
    },
    {
      fieldName: 'YEAR',
      visible: false,
    },
    {
      fieldName: 'REQ_DIV',
      visible: false,
    },
    {
      fieldName: 'REQ_CHA',
      visible: false,
    },
    {
      fieldName: 'SAVE_YN',
      visible: false,
    },
    {
      fieldName: 'DEPT_CD',
      visible: false,
    },
    {
      fieldName: 'ASGN_CD',
      visible: false,
    },
    {
      fieldName: 'EXCEL_UPDATE',
      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    'DEPT_NM',
    'USER_DIV',
    'TEAM_NM',
    'EMP_NO',
    'EMP_NM',
    'REQUEST_YN',
    {
      name: 'READ',
      direction: 'horizontal',
      items: ['READ_LEFT', 'READ_RIGHT'],
    },
    {
      name: 'SPH.D',
      direction: 'horizontal',
      items: ['SPHD_LEFT', 'SPHD_RIGHT'],
    },
    {
      name: 'CYL.D',
      direction: 'horizontal',
      items: ['CYLD_LEFT', 'CYLD_RIGHT'],
    },
    {
      name: 'AXIS˚',
      direction: 'horizontal',
      items: ['AXIS_LEFT', 'AXIS_RIGHT'],
    },
    'EYESIGHT_ADD',
    'PD',
    'FRAME',
    'SHADE_CLIP',
    'LENS',
    'RESULT',
    'RECEIVE_DT',
    'REMARK',
  ],
})

grdMainProps.columns = grdMainProps.fields

const initCodeList = async () => {
  const res = await Promise.all([
    getCodeList('HHII806'), // 도수보안경
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'Y' },
    }), // 사업부
    commonSearchApi({
      queryId: 'HLTHC0030_SEARCH_GLASSES',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }), // 도수보안경
  ])

  codeList.REQ_CHA = res[0].ORESULT_CUR
  codeList.BSNS_CD = res[1].ORESULT_CUR
  codeList.GLASSES = res[2].ORESULT_CUR
  codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
  codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

  grdMain.value.setBindingColumn('USER_DIV', codeList.USER_DIV, 'COD', 'TXT')
  grdMain.value.setBindingColumn('RESULT', codeList.RESULT, 'COD', 'TXT')
}

const reCodeList = (list) => {
  const newArray = list.map((item) => ({
    value: item.TXT,
    text: item.TXT,
  }))

  return newArray
}

const setDeptList = async () => {
  codeList.DEPT_CD = []
  searchParams.DEPT_CD = ''
  Promise.all([
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV: 'Y',
      },
    }), // 부서
  ]).then((res) => {
    codeList.DEPT_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
  })
}

const updateBsnsCd = async () => {
  await setDeptList()
  onButtonsClick({ id: 'btnSearch' })
}

const getAdmin = async () => {
  if (
    userStore.authGrpCd.includes('HLTH001') || // 안전보호구 모듈 관리자
    userStore.authGrpCd.includes('GRP00372') // 보건 총괄관리자
  ) {
    return 2
  } else {
    return 0
  }
}

const onButtonsClick = async (btn) => {
  if (isAdmin.value <= 0) {
    return Message.warn(t('권한이 없습니다. 보건관리팀 담당자에게 문의하세요.'))
  }

  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(() => searchDatas())
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnFormDownload') {
    let params = {
      FILE_PATH: 'HLTH',
      FILE_NAME: '도수보안경 시력검사결과 업로드 샘플.xlsx',
    }
    commonSampleDownFilesApi(params)
    //excelDownSample();
  } else if (btn.id === 'btnExcelUpload') {
    // let dataRows = grdMain.value.getDataProvider().getRowCount()

    // if (dataRows <= 0) {
    //   return Message.warn(t('적용 할 데이터가 없습니다.'))
    // }

    const reqChaTxt = codeList.REQ_CHA.find((el) => el.COD === searchParams.REQ_CHA)
    vm.$swal({
      title: t(searchParams.YEAR.toString() + '년도' + ' ' + reqChaTxt.TXT + ' 시력검사결과를 업로드 하시겠습니까?'), //\r\n
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed === true) {
        const input = document.createElement('input')
        input.type = 'file'
        input.onchange = function (event) {
          const selectedFile = event.target.files[0]
          // 선택된 파일에 대한 처리
          getJsonFromExcel(selectedFile, excelUploadCallback, 1)
        }
        input.click()
      }
    })
  } else if (btn.id === 'btnUpdate') {
    await saveData()
  } else if (btn.id === 'btnPayProcess'){
    payProcessData()
  }
}

//최종산출
const excelDownSample = () => {
  // let params = {
  //   FILE_PATH: 'HLTH',
  //   FILE_NAME: '안전화 정기 지급 업로드 샘플.xlsx',
  // }
  // commonSampleDownFilesApi(params)

  commonStore.loading = true
  commonRequest2('hse/excel/HLTHC0030_EXCEL', searchParams).then((res) => {
    commonStore.loading = false

    const blob = new Blob([res], { type: res.type })

    const link = document.createElement('a')

    let month = ''
    if (searchParams.REQ_CHA.length > 1) {
      month = searchParams.REQ_CHA
    } else {
      month = '0' + searchParams.REQ_CHA
    }

    const fileName = `${searchParams.YEAR}년도 ${month}월 도수보안경 시력검사결과 업로드 샘플`.trim()

    link.href = URL.createObjectURL(blob)

    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

const getReqestPriod = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0010_SEARCH_03",
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
      },
    }),
  ]);

  return res[0].ORESULT_CUR;
};

const setReqestPriod = async (res) => {
  searchParams.REQ_CHA = res[0].REQ_CHA;
};

onMounted(async () => {
  isAdmin.value = await getAdmin()
  await initCodeList()
  const res = await getReqestPriod();
  if (res != null && res.length > 0) {
    await setReqestPriod(res);
  }
  await setDeptList()
  await setGridItem()
  setTimeout(() => {
    grdMain.value.getGridView().refresh()
  }, 100)
  await nextTick()
  grdMain.value.getGridView().filterPanel.visible = true
  ready.value = true
})

const setGridItem = async () => {
  grdMain.value.getGridView().setColumnProperty('FRAME', 'lookupData', reCodeList(codeList.GLASSES))
  grdMain.value.getGridView().setColumnProperty('FRAME', 'editor', {
    type: 'dropdown',
    domainOnly: true,
    list: reCodeList(codeList.GLASSES),
  })

  // console.log('여기타?? : ', reCodeList(codeList.GLASSES))
}

const deleteDatas = async () => {
  let deleteParam = [
    {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      YEAR: searchParams.YEAR,
      REQ_DIV: searchParams.REQ_DIV,
      REQ_CHA: searchParams.REQ_CHA,
      USER_ID: userStore.userId,
    },
  ]

  console.log('deleteParam : ', deleteParam)
  return commonExecuteApi({ queryId: 'HLTHC0030_DELETE_01', list: deleteParam })
}

const payProcessData = () => {
  new saveFlowHelper(vm, t)
      .setBefore(beforePayProcessSave)
      .setQuery(savePayProcessDatas)
      .setAfter(afterPayProcessSave).run()
}

const beforePayProcessSave = () => {
  const dataProvider = grdMain.value.getDataProvider();

  const itemIndex = dataProvider.searchDataRow({
    fields: ["RESULT"],   // 여러 필드 동시 매칭
    values: ["Y"],
    startIndex:0, 
    wrap: false,
  });

  if(itemIndex < 0){
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }

  // const rowCount = dataProvider.getRowCount();

  // for (let i = 0; i < rowCount; i++){
  //   if(dataProvider.getValue(i, "RESULT") === 'Y'){
  //     if(dataProvider.getValue(i, "RECEIVE_DT") === '' || 
  //      dataProvider.getValue(i, "RECEIVE_DT") === null){
  //       Message.warn(t("지급일자를 선택해주세요."));
  //       grdMain.value
  //         .getGridView()
  //         .setCurrent({ dataRow: i, column: "RECEIVE_DT" });
  //       grdMain.value.getGridView().setFocus(true);
  //       return false;
  //     }  
  //   }
  // }
  return true
}

const savePayProcessDatas = () => {
  let saveParam = []
  for (let rowIdx = 0; rowIdx < grdMain.value.getDataProvider().getRowCount(); rowIdx++) {
    if(grdMain.value.getDataProvider().getValue(rowIdx, "RECEIVE_DT") != '' &&
       grdMain.value.getDataProvider().getValue(rowIdx, "RECEIVE_DT") != null) {
        let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
        let saveData = {
          CMPNY_DIV: data.CMPNY_DIV,
          YEAR: data.YEAR,
          REQ_DIV: data.REQ_DIV,
          REQ_CHA: data.REQ_CHA,
          RECEIVE_YN: 'Y',
          RECEIVE_DT: data.RECEIVE_DT,
          EMP_NO: data.EMP_NO,
          USER_ID: userStore.userId,
        }

        saveParam.push(saveData)
      }
  }
  
  return commonExecuteApi({
    queryId: 'HLTHC0030_SAVE_03',
    list: saveParam,
  })
}

const afterPayProcessSave = () => {
  onButtonsClick({ id: 'btnSearch' })
}



const saveData = async () => {
  new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveDatas).setAfter(afterSave).run()
}

const beforeSave = async () => {
  let dataRows = grdMain.value.getDataProvider().getRowCount()

  if (dataRows <= 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }

  const dataProvider = grdMain.value.getDataProvider();
  const rowCount = dataProvider.getRowCount();
  let cnt = 0;

  for (let i = 0; i < rowCount; i++){
    if(dataProvider.getValue(i, "EXCEL_UPDATE") === 'Y'){
      if(dataProvider.getValue(i, "FRAME") === '' || 
       dataProvider.getValue(i, "FRAME") === null){
        Message.warn(t("FRAME을 선택해주세요."));
        grdMain.value
          .getGridView()
          .setCurrent({ dataRow: i, column: "FRAME" });
        grdMain.value.getGridView().setFocus(true);
        return false;
      }
      cnt++;  
    }
  }
  if(cnt === 0){
    Message.warn(t("엑셀 업로드를 진행해주세요."));
    return false;
  }

  return true
}

const saveDatas = async () => {
  let temp = null

  const res = await deleteDatas()

  if (res) {
    let saveParam = []
    for (let rowIdx = 0; rowIdx < grdMain.value.getDataProvider().getRowCount(); rowIdx++) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      // console.log('data', data)
      if (data.EXCEL_UPDATE === 'Y') {
        let saveData = {
          CMPNY_DIV: data.CMPNY_DIV,
          YEAR: data.YEAR,
          REQ_DIV: data.REQ_DIV,
          REQ_CHA: data.REQ_CHA,
          DEPT_NM: data.DEPT_NM,
          TEAM_NM: data.TEAM_NM,
          EMP_NO: data.EMP_NO,
          EMP_NM: data.EMP_NM,
          READ_RIGHT: data.READ_RIGHT,
          READ_LEFT: data.READ_LEFT,
          SPHD_RIGHT: data.SPHD_RIGHT,
          SPHD_LEFT: data.SPHD_LEFT,
          CYLD_RIGHT: data.CYLD_RIGHT,
          CYLD_LEFT: data.CYLD_LEFT,
          AXIS_RIGHT: data.AXIS_RIGHT,
          AXIS_LEFT: data.AXIS_LEFT,
          EYESIGHT_ADD: data.EYESIGHT_ADD,
          PD: data.PD,
          FRAME: data.FRAME,
          SHADE_CLIP: data.SHADE_CLIP,
          // RECEIVE_DT: data.RECEIVE_DT,
          // RECEIVE_YN: 'Y',
          LENS: data.LENS,
          REMARK: data.REMARK,
          USER_ID: userStore.userId,
        }

        saveParam.push(saveData)
      }
    }
    console.log('saveParam : ', saveParam)
    temp = await commonExecuteApi({
      queryId: 'HLTHC0030_SAVE_02',
      list: saveParam,
    })
  }

  return temp
}

const afterSave = async () => {
  onButtonsClick({ id: 'btnSearch' })
}

const searchDatas = async () => {
  //userData
  return commonSearchApi({
    queryId: 'HLTHC0030_SEARCH_01',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: searchParams.YEAR,
      REQ_CHA: searchParams.REQ_CHA,
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: searchParams.DEPT_CD,
      USER_DIV: searchParams.USER_DIV,
    },
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  grdMain.value.getGridView().setRowStyleCallback(function (grid, item, fixed) {
    let ret = { style: { background: '#eff8fd' } }
    if (isEmpty(grid.getValue(item.index, 'FRAME'))) {
      ret.style = { background: '#FF8888' }
    }
    return ret
  })

  grdMain.value.getGridView().setTopItem(0)

}

// function setFrameIfValid(row, incoming) {
//   const code = new Map(codeList.GLASSES.map(x => [x.TXT, x.COD])).get(incoming)
//   //txtToCod.get(String(incoming).trim());
//   if (code !== undefined) {
//     console.log('dsadas : ',code)
//     dataProvider.setValue(row, 'FRAME', code); // COD만 set
//     return true;
//   }
//   return false;
// }

function setFrameIfValid(incoming) {
  const code = new Map(codeList.GLASSES.map((x) => [x.TXT, x.COD])).get(incoming)
  //txtToCod.get(String(incoming).trim());
  if (code !== undefined) {
    console.log('dsadas : ', code)
    //dataProvider.setValue(row, 'FRAME', code); // COD만 set
    return incoming
  }
  return ''
}

const excelUploadCallback = (excelData) => {
  grdMain.value.getGridView().filterPanel.clearInput()
  let excelParam = []

  excelData.map((item) => {
    if (!isEmpty(item.사번)) {
      excelParam[item.사번] = {
        EMP_NO: item.사번,
        EMP_NM: item.성명,
        DEPT_NM: item.부서명,
        TEAM_NM: '', //item.__EMPTY_2,
        READ_LEFT: item['READ(L)'],
        READ_RIGHT: item['READ(R)'],
        SPHD_LEFT: item['SPH(L)'],
        SPHD_RIGHT: item['SPH(R)'],
        CYLD_LEFT: item['CYL(L)'],
        CYLD_RIGHT: item['CYL(R)'],
        AXIS_LEFT: item['AXIS(L)'],
        AXIS_RIGHT: item['AXIS(R)'],
        EYESIGHT_ADD: item.ADD,
        PD: item.PD,
        FRAME: setFrameIfValid(item.FRAME),
        SHADE_CLIP: item.차광클립,
        LENS: item.렌즈,
        REMARK: item.비고,
      }
    }
  })

  const dataProvider = grdMain.value.getDataProvider()

  for (let i = 0; i < dataProvider.getRowCount(); i++) {
    if (excelParam[dataProvider.getValue(i, 'EMP_NO')]) {
      const data = excelParam[dataProvider.getValue(i, 'EMP_NO')]

      dataProvider.setValue(i, 'READ_LEFT', data.READ_LEFT)
      dataProvider.setValue(i, 'READ_RIGHT', data.READ_RIGHT)
      dataProvider.setValue(i, 'SPHD_LEFT', data.SPHD_LEFT)
      dataProvider.setValue(i, 'SPHD_RIGHT', data.SPHD_RIGHT)
      dataProvider.setValue(i, 'CYLD_LEFT', data.CYLD_LEFT)
      dataProvider.setValue(i, 'CYLD_RIGHT', data.CYLD_RIGHT)
      dataProvider.setValue(i, 'AXIS_LEFT', data.AXIS_LEFT)
      dataProvider.setValue(i, 'AXIS_RIGHT', data.AXIS_RIGHT)
      dataProvider.setValue(i, 'EYESIGHT_ADD', data.EYESIGHT_ADD)
      dataProvider.setValue(i, 'PD', data.PD)
      //setFrameIfValid(i,data.FRAME)
      dataProvider.setValue(i, 'FRAME', data.FRAME)
      dataProvider.setValue(i, 'SHADE_CLIP', data.SHADE_CLIP)
      dataProvider.setValue(i, 'LENS', data.LENS)
      dataProvider.setValue(i, 'REMARK', data.REMARK)
      dataProvider.setValue(i, 'EXCEL_UPDATE', 'Y')
      //dataProvider.setValue(i, 'RECEIVE_YN', '')
      dataProvider.setValue(i, 'RECEIVE_DT', '')

      //excelParam = excelParam.filter(item => item.EMP_NO !== dataProvider.getValue(i, "EMP_NO"));
      delete excelParam[dataProvider.getValue(i, 'EMP_NO')]
    } else {
      dataProvider.setValue(i, 'READ_LEFT', '')
      dataProvider.setValue(i, 'READ_RIGHT', '')
      dataProvider.setValue(i, 'SPHD_LEFT', '')
      dataProvider.setValue(i, 'SPHD_RIGHT', '')
      dataProvider.setValue(i, 'CYLD_LEFT', '')
      dataProvider.setValue(i, 'CYLD_RIGHT', '')
      dataProvider.setValue(i, 'AXIS_LEFT', '')
      dataProvider.setValue(i, 'AXIS_RIGHT', '')
      dataProvider.setValue(i, 'EYESIGHT_ADD', '')
      dataProvider.setValue(i, 'PD', '')
      //setFrameIfValid(i,"FRAME")
      dataProvider.setValue(i, 'FRAME', '')
      dataProvider.setValue(i, 'SHADE_CLIP', '')
      dataProvider.setValue(i, 'LENS', '')
      dataProvider.setValue(i, 'REMARK', '')
      //dataProvider.setValue(i, 'RECEIVE_YN', '')
      dataProvider.setValue(i, 'RECEIVE_DT', '')
    }
  }

  const mapSize = Object.keys(excelParam).length

  console.log(`mapSize: ${mapSize}`)

  for (let i = 0; i < mapSize; i++) {
    const key = Object.keys(excelParam)[i]
    const data = excelParam[key]
    const rowCount = grdMain.value.getDataProvider().getRowCount()

    console.log(`rowCount: ${rowCount}`)

    grdMain.value.getDataProvider().insertRow(rowCount, {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      YEAR: searchParams.YEAR,
      REQ_DIV: searchParams.REQ_DIV,
      REQ_CHA: searchParams.REQ_CHA,
      DEPT_NM: data.DEPT_NM,
      TEAM_NM: data.TEAM_NM,
      EMP_NO: data.EMP_NO,
      EMP_NM: data.EMP_NM,
      READ_RIGHT: data.READ_RIGHT,
      READ_LEFT: data.READ_LEFT,
      SPHD_RIGHT: data.SPHD_RIGHT,
      SPHD_LEFT: data.SPHD_LEFT,
      CYLD_RIGHT: data.CYLD_RIGHT,
      CYLD_LEFT: data.CYLD_LEFT,
      AXIS_RIGHT: data.AXIS_RIGHT,
      AXIS_LEFT: data.AXIS_LEFT,
      EYESIGHT_ADD: data.EYESIGHT_ADD,
      PD: data.PD,
      FRAME: data.FRAME,
      SHADE_CLIP: data.SHADE_CLIP,
      LENS: data.LENS,
      REMARK: data.REMARK,
      EXCEL_UPDATE: 'Y',
      //USER_ID: userStore.userId,
    })
  }
}

//2025.08.26 김현재 작성
//일자일괄입력 버튼클릭 이벤트
const btnDateAllInput = () => {
  let grdMainData = grdMain.value.getDataProvider().getJsonRows()
  console.log('grdMainData', grdMainData)
  if (!dateAllInput.value) {
    Message.warn(t('일괄입력할 날짜를 선택해주세요'))
    return false
  }
  for (let i = 0; i < grdMainData.length; i++) {
    //지급된것만 일자넣음
    if (grdMainData[i].RESULT === 'Y') {
      grdMain.value.getDataProvider().setValue(i, 'RECEIVE_DT', dateAllInput.value)
    }
  }
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :usePermission="true"
        :button-list="['btnSearch', 'btnFormDownload', 'btnExcelUpload', 'btnUpdate', 'btnPayProcess']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea" v-if="ready">
          <div class="d-flex flex-gap">
            <i-select
              v-model="searchParams.YEAR"
              :label="$t('해당년도')"
              label-width="50px"
              type="YEAR"
              class="custom-flex-1"
            />
            <i-select
              v-model="searchParams.REQ_CHA"
              :label="$t('신청시기')"
              label-width="50px"
              :items="codeList.REQ_CHA"
              item-value="COD"
              item-title="TXT"
              class="custom-flex-1"
            />
            <i-select
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              class="custom-flex-2"
              labelWidth="50px"
              v-model="searchParams.BSNS_CD"
              @update:modelValue="updateBsnsCd"
            />
            <i-select
              :label="$t('부서')"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              class="custom-flex-2"
              labelWidth="50px"
              v-model="searchParams.DEPT_CD"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            />
            <div class="custom-flex-2 pr-2 d-flex">
              <i-label class="flex-grow-1 d-flex">
                <span
                  class="form-label pr-1 pt-2"
                  :style="{
                    display: 'block',
                    width: '60px',
                    margin: '0 4px 0 0',
                  }"
                >
                  {{ $t('구분 ') }}
                </span>
                <div>
                  <v-radio-group v-model="searchParams.USER_DIV" inline class="radioStyle">
                    <v-radio v-for="item in codeList.USER_DIV" :key="item" :value="item.COD" :label="item.TXT" />
                  </v-radio-group>
                </div>
              </i-label>
            </div>
            <i-input type="date" class="custom-flex-1" style="margin-left: 0px" v-model="dateAllInput"></i-input>
            <v-btn @click="btnDateAllInput">지급일자 일괄입력</v-btn>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          >
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
    <!-- <v-card-text class="pa-0 pt-3 content-area">
      <div class="d-flex flex-column fill-height">
        <div class="h-grow d-flex flex-area-gap">
          <v-sheet class="pa-0 h-auto custom-flex-2">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellClicked="onCellClicked"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </div>
    </v-card-text> -->
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
// .tooltip-wrapper {
//   position: absolute;
// }
// .tooltip {
//   position: relative; /* 화살표가 툴팁 아래에 위치하도록 */
//   background-color: #424242;
//   color: #fff;
//   padding: 5px 10px;
//   border-radius: 4px;
//   z-index: 1000; /* 툴팁이 다른 요소 위에 보이도록 */
//   pointer-events: none; /* 툴팁이 마우스 이벤트를 받지 않도록 */
//   white-space: nowrap; /* 내용이 줄바꿈되지 않도록 */
// }

// .tooltip-arrow {
//   width: 0;
//   height: 0;
//   border-left: 5px solid transparent; /* 화살표의 왼쪽 부분 */
//   border-right: 5px solid transparent; /* 화살표의 오른쪽 부분 */
//   border-top: 5px solid #424242; /* 화살표의 색상 */
//   position: absolute;
//   left: 50%; /* 가운데 정렬 */
//   transform: translateX(-50%); /* 수평 중심으로 이동 */
//   top: 100%; /* 툴팁 아래에 위치 */
// }

.flex-gap {
  gap: 20px;
  flex-wrap: wrap;
}

.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 1 1 0 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 20px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}
.custom-flex-3 {
  /* width: calc(25% - 0px) !important; */
  flex: 3 1 0 !important;
  // flex-basis: calc(0% + 10px) !important;
  flex-basis: calc(0% + 40px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
  align-items: center;
}

.radioStyle {
  padding-left: 5px;
  height: 35px;
  background-color: rgb(255, 255, 255);
  border: 1px solid;
  border-radius: 2px;
  border-color: #e0e0e0; //#CCCCCC;
  // width: 80%;
  font-size: x-small;
  display: flex;
  align-items: center;
}
</style>
