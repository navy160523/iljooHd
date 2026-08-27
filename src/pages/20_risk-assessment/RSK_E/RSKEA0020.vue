<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"

defineOptions({
  name: "20_risk_assessment-RSK_E-RSKEA0020",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const searchArea = ref(null)
const grd1 = ref(null)
const grd2 = ref(null)
const grd3 = ref(null)

// 코드구분: 대중소(DIV) 그리드 셀 클릭 시 대->중->소 순으로 데이터 조회
const transGrdData = reactive({
  grdT: [], // 대분류 -> 중분류
  grdM: [], // 중분류 -> 소분류
})

//조회조건
const searchParams = reactive({
  COMP_CODE: "",
  CODE_GUBUN: "",
  BIZ_CODE: "",
  BIZ_UNIT: "",
})

const codeList = reactive({
  company: [],
  BSNS_CD: [],
  DEPT_CD: [],
  CODE_GUBUN: [
    { COD: "DIV", TXT: "대중소" },
    { COD: "HZ", TXT: "표준위험요인" },
    { COD: "DEPT", TXT: "부서코드 매핑" },
  ],
  BIZ_UNIT: [],
})

// 조회체크
var isSearch = false

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({ queryId: "searchBSNS", param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" } }), // 사업부
    getCodeList("HHIOB_UNIT"), // 비지니스 단위 API
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR
    codeList.BIZ_UNIT = res[2].ORESULT_CUR

    searchParams.COMP_CODE = res[0].ORESULT_CUR[0].COD
    searchParams.BIZ_CODE = res[1].ORESULT_CUR[0].BSNS_CD
    searchParams.BIZ_UNIT = res[2].ORESULT_CUR[0].COD
  })
}

/* ------------------------ 대분류 ------------------------ */
const grdProps1 = reactive({
  gridViewOption: { checkBar: { visible: true }, rowIndicator: { visible: false } },
  keys: ["COMM_ID"],
  fields: [
    { fieldName: "COMM_ID", dataType: "text", width: "160", header: { text: t("분류코드") }, editable: false },
    { fieldName: "CODE_NM", dataType: "text", header: { text: t("코드명") }, editor: { type: "line" }, lookupDisplay: true },
    { fieldName: "CODE_SORT", dataType: "int", header: { text: t("정렬순서") }, editable: true },

    // 출력 안함
    { fieldName: "COMP_CODE", dataType: "text", visible: false },
    { fieldName: "BIZ_CODE", dataType: "text", visible: false },
    { fieldName: "CODE_GUBUN", dataType: "text", visible: false },
    { fieldName: "BIZ_UNIT", dataType: "text", visible: false },
    { fieldName: "CODE_KIND", dataType: "text", visible: false },
    { fieldName: "CODE_TYPE", dataType: "text", visible: false },
    { fieldName: "CODE_VALUE", dataType: "text", visible: false },
    { fieldName: "FAKECOMMIDT", dataType: "text", visible: false },
    { fieldName: "PARENT_COMM_ID", dataType: "text", visible: false },
    { fieldName: "USE_YN", dataType: "text", visible: false },
    { fieldName: "INS_USR", dataType: "text", visible: false },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

/* ------------------------ 중분류 ------------------------ */
const grdProps2 = reactive({
  gridViewOption: { checkBar: { visible: true }, rowIndicator: { visible: false } },
  keys: ["COMM_ID"],
  fields: [
    { fieldName: "COMM_ID", dataType: "text", width: "160", header: { text: t("분류코드") }, editable: false },
    { fieldName: "CODE_NM", dataType: "text", header: { text: t("코드명") }, editable: true },
    { fieldName: "CODE_SORT", dataType: "int", header: { text: t("정렬순서") }, editable: true },

    // 출력 안함
    { fieldName: "COMP_CODE", dataType: "text", visible: false },
    { fieldName: "BIZ_CODE", dataType: "text", visible: false },
    { fieldName: "CODE_GUBUN", dataType: "text", visible: false },
    { fieldName: "BIZ_UNIT", dataType: "text", visible: false },
    { fieldName: "CODE_KIND", dataType: "text", visible: false },
    { fieldName: "CODE_TYPE", dataType: "text", visible: false },
    { fieldName: "CODE_VALUE", dataType: "text", visible: false },
    { fieldName: "FAKECOMMIDT", dataType: "text", visible: false },
    { fieldName: "PARENT_COMM_ID", dataType: "text", visible: false },
    { fieldName: "USE_YN", dataType: "text", visible: false },
  ],
  columns: [],
})

grdProps2.columns = grdProps2.fields

/* ------------------------ 소분류 ------------------------ */
const grdProps3 = reactive({
  gridViewOption: { checkBar: { visible: true }, rowIndicator: { visible: false } },
  keys: ["COMM_ID"],
  fields: [
    { fieldName: "COMM_ID", dataType: "text", width: "160", header: { text: t("분류코드") }, editable: false },
    { fieldName: "CODE_NM", dataType: "text", header: { text: t("코드명") }, editable: true },
    { fieldName: "CODE_SORT", dataType: "int", header: { text: t("정렬순서") }, editable: true },

    // 출력 안함
    { fieldName: "COMP_CODE", dataType: "text", visible: false },
    { fieldName: "BIZ_CODE", dataType: "text", visible: false },
    { fieldName: "CODE_GUBUN", dataType: "text", visible: false },
    { fieldName: "BIZ_UNIT", dataType: "text", visible: false },
    { fieldName: "CODE_KIND", dataType: "text", visible: false },
    { fieldName: "CODE_TYPE", dataType: "text", visible: false },
    { fieldName: "CODE_VALUE", dataType: "text", visible: false },
    { fieldName: "FAKECOMMIDT", dataType: "text", visible: false },
    { fieldName: "PARENT_COMM_ID", dataType: "text", visible: false },
    { fieldName: "USE_YN", dataType: "text", visible: false },
  ],
  columns: [],
})

grdProps3.columns = grdProps3.fields

// 부서코드 리스트 변경
const changeDeptCd = () => {
  codeList.DEPT_CD = []
  // grd1.value.getGridView().columnByName('CODE_NM')._lookupMap = {}

  Promise.all([
    commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BIZ_CODE },
    }),
  ]).then((res) => {
    console.log(res[0].ORESULT_CUR)
    codeList.DEPT_CD = res[0].ORESULT_CUR
    grd1.value.setBindingColumn("CODE_NM", codeList.DEPT_CD, "DEPT_CD", "DEPT_NM")
  })
}

/* -------------- 버튼 이벤트 -------------- */
// SearchArea
const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    transGrdData.grdT = []
    transGrdData.grdM = []
    grd1.value.getDataProvider().setRows([])
    grd2.value.getDataProvider().setRows([])
    grd3.value.getDataProvider().setRows([])
    changeDeptCd()
    new queryFlowHelper(vm, t).setGridList([grd1]).setBefore(beforeSearch).setQuery(searchData).setAfter(afterSearch).run()
    isSearch = true
  } else if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(saveValiCheck)
      .setQuery(saveData)
      .setAfter(() => {
        grd1.value.getDataProvider().setRows([])
        onButtonsClick({ id: "btnSearch" })
        grd2.value.getDataProvider().setRows([])
        grd3.value.getDataProvider().setRows([])
      })
      .run()
  }
}

// 대분류 버튼 이벤트
const onClickBtnT = (btn) => {
  if (btn.id === "btnCreate") {
    // if (grd1.value.getDataProvider().getRows().length === 0) {
    if (isSearch === false) {
      return Message.err("데이터를 조회해주세요.")
    } else {
      const row = grd1.value.getDataProvider().getRows() // 수정하기위한 그리드 데이터 가져오기

      // 그리드 데이터 중 최댓값
      let maxList = []

      for (let i in row) {
        maxList.push(row[i][0].substr(row[i][0].length - 2, 2))
      }

      let maxNum = Math.max(...maxList) == -Infinity ? 0 : Math.max(...maxList)

      let compCode = searchParams.COMP_CODE

      // 코드구분: 대중소(DIV)
      const autoDivNum =
        row.length < 9
          ? compCode + searchParams.BIZ_CODE + searchParams.BIZ_UNIT + "T" + "0" + (maxNum + 1)
          : compCode + searchParams.BIZ_CODE + searchParams.BIZ_UNIT + "T" + (maxNum + 1)

      // 코드구분: 표준위험요인 / 부서코드 매핑 (HZ / DEPT)
      const autoHzDeptNum =
        row.length < 9
          ? searchParams.CODE_GUBUN + compCode + searchParams.BIZ_CODE + searchParams.BIZ_UNIT + "T" + "0" + (maxNum + 1)
          : searchParams.CODE_GUBUN + compCode + searchParams.BIZ_CODE + searchParams.BIZ_UNIT + "T" + (maxNum + 1)

      grd1.value.addRow({
        COMP_CODE: userStore.cmpnyDiv,
        BIZ_CODE: searchParams.BIZ_CODE,
        CODE_GUBUN: searchParams.CODE_GUBUN,
        BIZ_UNIT: searchParams.BIZ_UNIT,
        CODE_TYPE: "T",
        COMM_ID: searchParams.CODE_GUBUN === "DIV" ? autoDivNum : autoHzDeptNum,
        CODE_NM: "",
        CODE_SORT: "",
      })
    }
  } else if (btn.id === "btnDelete") {
    if (grd1.value.getDataProvider().getRows().length === 0) {
      return Message.err("데이터를 조회해주세요.")
    } else {
      if (grd2.value.getDataProvider().getRows().length > 0) {
        return Message.err("중분류 데이터를 삭제해주세요.")
      } else {
        new deleteFlowHelper(vm, t)
          .setBefore(delValiCheck)
          .setQuery(deleteData)
          .setAfter(() => {
            onButtonsClick({ id: "btnSearch" })
          })
          .run()
      }
    }
  }
}

// 중분류 버튼 이벤트
const onClickBtnM = (btn) => {
  if (btn.id === "btnCreate") {
    const row = grd2.value.getDataProvider().getRows() // 수정하기위한 그리드 데이터 가져오기

    // 그리드 데이터 중 최댓값
    let maxList = []

    for (let i in row) {
      maxList.push(row[i][0].substr(row[i][0].length - 2, 2))
    }

    let maxNum = Math.max(...maxList) == -Infinity ? 0 : Math.max(...maxList)

    if (!transGrdData.grdT.COMM_ID) {
      return Message.err("데이터를 조회해주세요.")
    } else {
      if (grd2.value.getDataProvider().getRows().length === 0) {
        grd2.value.addRow({
          COMP_CODE: userStore.cmpnyDiv,
          BIZ_CODE: searchParams.BIZ_CODE,
          CODE_GUBUN: searchParams.CODE_GUBUN,
          BIZ_UNIT: searchParams.BIZ_UNIT,
          CODE_TYPE: "M",
          COMM_ID: maxNum < 9 ? transGrdData.grdT.COMM_ID + "M0" + (maxNum + 1) : transGrdData.grdT.COMM_ID + "M" + (maxNum + 1),
          CODE_NM: "",
          CODE_SORT: "",
          PARENT_COMM_ID: transGrdData.grdT.COMM_ID,
        })
      } else {
        const editID = row[0][0].substr(0, row[0][0].length - 2) // row[0][0] => COMM_ID

        grd2.value.addRow({
          COMP_CODE: userStore.cmpnyDiv,
          BIZ_CODE: searchParams.BIZ_CODE,
          CODE_GUBUN: searchParams.CODE_GUBUN,
          BIZ_UNIT: searchParams.BIZ_UNIT,
          CODE_TYPE: "M",
          COMM_ID: maxNum < 9 ? editID + "0" + (maxNum + 1) : editID + (maxNum + 1),
          CODE_NM: "",
          CODE_SORT: "",
          PARENT_COMM_ID: transGrdData.grdT.COMM_ID,
        })
      }
    }
  } else if (btn.id === "btnDelete") {
    if (!transGrdData.grdT.COMM_ID) {
      return Message.err("데이터를 조회해주세요.")
    } else {
      if (grd3.value.getDataProvider().getRows().length > 0) {
        return Message.err("소분류 데이터를 삭제해주세요.")
      } else {
        new deleteFlowHelper(vm, t)
          .setBefore(delValiCheck)
          .setQuery(deleteData)
          .setAfter(() => {
            grd2.value.getDataProvider().setRows([])
            grd3.value.getDataProvider().setRows([])
          })
          .run()
      }
    }
  }
}

// 소분류 버튼 이벤트
const onClickBtnS = (btn) => {
  if (btn.id === "btnCreate") {
    const row = grd3.value.getDataProvider().getRows() // 수정하기위한 그리드 데이터 가져오기

    // 그리드 데이터 중 최댓값
    let maxList = []

    for (let i in row) {
      maxList.push(row[i][0].substr(row[i][0].length - 2, 2))
    }

    let maxNum = Math.max(...maxList) == -Infinity ? 0 : Math.max(...maxList)
    if (!transGrdData.grdM.COMM_ID) {
      return Message.err("데이터를 조회해주세요.")
    } else {
      if (grd3.value.getDataProvider().getRows().length === 0) {
        grd3.value.addRow({
          COMP_CODE: userStore.cmpnyDiv,
          BIZ_CODE: searchParams.BIZ_CODE,
          CODE_GUBUN: searchParams.CODE_GUBUN,
          BIZ_UNIT: searchParams.BIZ_UNIT,
          CODE_TYPE: "S",
          COMM_ID: maxNum < 9 ? transGrdData.grdM.COMM_ID + "S0" + (maxNum + 1) : transGrdData.grdM.COMM_ID + (maxNum + 1),
          CODE_NM: "",
          CODE_SORT: "",
          PARENT_COMM_ID: transGrdData.grdM.COMM_ID,
        })
      } else {
        const editID = row[0][0].substr(0, row[0][0].length - 2) // row[0][0] => COMM_ID

        grd3.value.addRow({
          COMP_CODE: userStore.cmpnyDiv,
          BIZ_CODE: searchParams.BIZ_CODE,
          CODE_GUBUN: searchParams.CODE_GUBUN,
          BIZ_UNIT: searchParams.BIZ_UNIT,
          CODE_TYPE: "S",
          COMM_ID: maxNum < 9 ? editID + "0" + (maxNum + 1) : editID + (maxNum + 1),
          CODE_NM: "",
          CODE_SORT: "",
          PARENT_COMM_ID: transGrdData.grdM.COMM_ID,
        })
      }
    }
  } else if (btn.id === "btnDelete") {
    if (!transGrdData.grdM.COMM_ID) {
      return Message.err("데이터를 조회해주세요.")
    } else {
      new deleteFlowHelper(vm, t)
        .setBefore(delValiCheck)
        .setQuery(deleteData)
        .setAfter(() => {
          grd3.value.getDataProvider().setRows([])
        })
        .run()
    }
  }
}

/* ------------------------ 조회 ------------------------ */
const beforeSearch = async () => {
  return true
}

// 코드구분: 대중소 - 대분류 그리드
const searchData = () => {
  if (!searchParams.CODE_GUBUN || !searchParams.COMP_CODE || !searchParams.BIZ_CODE || !searchParams.BIZ_UNIT) {
    return Message.err("모든 조회조건을 선택해주세요.")
  }

  return commonSearchApi({ queryId: "RSKEF0030_search01", param: searchParams })
}

const afterSearch = (res) => {
  console.log("c")
  grd1.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* ---------- 중분류 그리드 (대분류에서 선택한 셀에 대한 데이터 출력) : 코드구분이 대중소(DIV)인 경우 ---------- */
const searchMiddle = async (grid, oldIdx, newIdx) => {
  if (newIdx < 0) {
    grd2.value.getDataProvider().setRows(null)

    return
  }

  const row = grd1.value.getDataProvider().getJsonRow(newIdx)
  const checkedRows = grd2.value.getGridView().getCheckedRows()

  const confirmAndSearch = async () => {
    const result = await vm.$swal({
      title: t("수정중인 데이터가 있습니다. 조회하시겠습니까?"),
      showCancelButton: true,
    })

    if (!result.isConfirmed) {
      return
    }

    transGrdData.grdT = []
    transGrdData.grdM = []
    grd2.value.getDataProvider().setRows([])
    grd3.value.getDataProvider().setRows([])

    transGrdData.grdT = row

    commonSearchApi({
      queryId: "RSKEF0030_search02",
      param: { COMM_ID: row.COMM_ID },
    }).then((res) => {
      grd2.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }

  if (searchParams.CODE_GUBUN === "DIV") {
    if (checkedRows.length !== 0) {
      await confirmAndSearch()
    } else {
      // 그리드 초기화
      transGrdData.grdT = []
      transGrdData.grdM = []
      grd2.value.getDataProvider().setRows([])
      grd3.value.getDataProvider().setRows([])

      transGrdData.grdT = row

      commonSearchApi({
        queryId: "RSKEF0030_search02",
        param: { COMM_ID: row.COMM_ID },
      }).then((res) => {
        grd2.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    }
  }
}

/* ---------- 소분류 그리드 (중분류에서 선택한 셀에 대한 데이터 출력) : 코드구분이 대중소(DIV)인 경우 ---------- */
const searchSmall = async (grid, oldIdx, newIdx) => {
  if (newIdx < 0) {
    grd2.value.getDataProvider().setRows(null)

    return
  }

  const row = grd2.value.getDataProvider().getJsonRow(newIdx)
  const checkedRows = grd3.value.getGridView().getCheckedRows()

  console.log("row", row)

  const confirmAndSearch = async () => {
    const result = await vm.$swal({
      title: t("수정중인 데이터가 있습니다. 조회하시겠습니까?"),
      showCancelButton: true,
    })

    if (!result.isConfirmed) {
      return
    }
    grd3.value.getDataProvider().setRows([])

    transGrdData.grdM = row

    commonSearchApi({
      queryId: "RSKEF0030_search03",
      param: { COMM_ID: row.COMM_ID },
    }).then((res) => {
      console.log("소분류", res)
      grd3.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }

  if (searchParams.CODE_GUBUN === "DIV") {
    if (checkedRows.length !== 0) {
      await confirmAndSearch()
    } else {
      // 그리드 초기화
      grd3.value.getDataProvider().setRows([])

      transGrdData.grdM = row

      commonSearchApi({
        queryId: "RSKEF0030_search03",
        param: { COMM_ID: row.COMM_ID },
      }).then((res) => {
        grd3.value.getDataProvider().setRows(res.ORESULT_CUR)
      })
    }
  }
}

/* ------------------------ 유효성 검사(저장) ------------------------ */
const saveValiCheck = () => {
  let validationList = []
  let checkRow1 = grd1.value.getGridView().getCheckedRows()
  let checkRow2 = grd2.value.getGridView().getCheckedRows()
  let checkRow3 = grd3.value.getGridView().getCheckedRows()

  // 대분류 그리드
  for (let rowIdx of checkRow1) {
    let data = grd1.value.getDataProvider().getJsonRow(rowIdx)
    if (!data.CODE_NM || !data.CODE_SORT) {
      return Message.warn(t("코드명과 정렬순서를 입력해주세요."))
    } else {
      validationList.push(data)
    }
  }

  // 중분류 그리드
  for (let rowIdx of checkRow2) {
    let data = grd2.value.getDataProvider().getJsonRow(rowIdx)
    if (!data.CODE_NM || !data.CODE_SORT) {
      return Message.warn(t("코드명과 정렬순서를 입력해주세요."))
    } else {
      validationList.push(data)
    }
  }

  // 소분류 그리드
  for (let rowIdx of checkRow3) {
    let data = grd3.value.getDataProvider().getJsonRow(rowIdx)
    if (!data.CODE_NM || !data.CODE_SORT) {
      return Message.warn(t("코드명과 정렬순서를 입력해주세요."))
    } else {
      validationList.push(data)
    }
  }

  if (validationList.length === 0) {
    Message.warn(t("선택된 데이터가 없습니다."))

    return false
  } else {
    return true
  }
}

/* ------------------------ 유효성 검사(삭제) ------------------------ */
const delValiCheck = () => {
  let validationList = []
  let checkRow1 = grd1.value.getGridView().getCheckedRows()
  let checkRow2 = grd2.value.getGridView().getCheckedRows()
  let checkRow3 = grd3.value.getGridView().getCheckedRows()

  // 대분류 그리드
  for (let rowIdx of checkRow1) {
    let data = grd1.value.getDataProvider().getJsonRow(rowIdx)
    validationList.push(data)
  }

  // 중분류 그리드
  for (let rowIdx of checkRow2) {
    let data = grd2.value.getDataProvider().getJsonRow(rowIdx)
    validationList.push(data)
  }

  // 소분류 그리드
  for (let rowIdx of checkRow3) {
    let data = grd3.value.getDataProvider().getJsonRow(rowIdx)
    validationList.push(data)
  }

  if (validationList.length === 0) {
    Message.warn(t("선택된 데이터가 없습니다."))

    return false
  } else {
    return true
  }
}

/* ------------------------ 저장 ------------------------ */
const saveData = () => {
  let saveParams = []

  let checkRow1 = grd1.value.getGridView().getCheckedRows()
  let checkRow2 = grd2.value.getGridView().getCheckedRows()
  let checkRow3 = grd3.value.getGridView().getCheckedRows()

  // 대분류 그리드
  for (let rowIdx of checkRow1) {
    let data = grd1.value.getDataProvider().getJsonRow(rowIdx)
    if (!data.CODE_NM && !data.CODE_SORT) {
      Message.warn(t("코드명, 정렬순서를 입력해주세요."))
    } else {
      saveParams.push(data)
    }
  }

  // 중분류 그리드
  for (let rowIdx of checkRow2) {
    let data = grd2.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  // 소분류 그리드
  for (let rowIdx of checkRow3) {
    let data = grd3.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId: "RSKEF0030_save01", list: saveParams })
}

/* ------------------------ 삭제 ------------------------ */
const deleteData = () => {
  let deleteParams = []
  let checkRow1 = grd1.value.getGridView().getCheckedRows()
  let checkRow2 = grd2.value.getGridView().getCheckedRows()
  let checkRow3 = grd3.value.getGridView().getCheckedRows()

  // 대분류 그리드
  for (let rowIdx of checkRow1) {
    let data = grd1.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }

  // 중분류 그리드
  for (let rowIdx of checkRow2) {
    let data = grd2.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }

  // 소분류 그리드
  for (let rowIdx of checkRow3) {
    let data = grd3.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }

  return commonExecuteApi({ queryId: "RSKEF0030_delete01", list: deleteParams })
}

// 코드구분이 변경될 때마다 그리드 초기화
watch(
  () => searchParams.CODE_GUBUN,
  (newValue, oldValue) => {
    if (oldValue !== newValue) {
      grd1.value.getDataProvider().setRows([])
      grd2.value.getDataProvider().setRows([])
      grd3.value.getDataProvider().setRows([])
      isSearch = false
    }

    if (newValue === "DEPT") {
      // 부서코드 리스트 API 호출
      Promise.all([
        commonSearchApi({
          queryId: "searchDept3",
          param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BIZ_CODE },
        }),
      ]).then((res) => {
        grdProps1.fields[1].editor.type = "dropdown"

        // codeList.DEPT_CD = res[0].ORESULT_CUR
        // grd1.value.setBindingColumn("CODE_NM", codeList.DEPT_CD, "DEPT_CD", "DEPT_NM") // 부서코드 매핑 - 대분류 그리드 코드명 LOOKUP 설정
      })
    } else {
      grdProps1.fields[1].editor.type = "line"
    }
  }
)

/* ---------------- 초기데이터 세팅 ---------------- */
onMounted(() => {
  initCodeList()
  searchParams.CODE_GUBUN = codeList.CODE_GUBUN[0].COD // 코드구분: 대중소(DIV) 출력
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle 
        ref="menuTitle" 
        :title="$t(useLogsStore().menuId)" 
        :button-list="['btnSearch', 'btnUpdate']" 
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <!-- 코드구분 -->
          <i-select
            :label="$t('코드구분')"
            label-width="65px"
            width="300px" 
            v-model="searchParams.CODE_GUBUN" 
            :items="codeList.CODE_GUBUN" 
            item-value="COD" 
            item-title="TXT"
          />
          <!-- 회사 -->
          <i-select
            :label="$t('회사')"
            label-width="65px"
            width="300px"
            v-model="searchParams.COMP_CODE"
            :items="codeList.company"
            item-value="COD"
            item-title="TXT"
            readonly
          />
          <!-- 사업부 -->
          <i-select
            :label="$t('사업부')"
            label-width="65px"
            width="300px" 
            v-model="searchParams.BIZ_CODE" 
            :items="codeList.bsnsCd" 
            item-value="BSNS_CD"
            item-title="BSNS_NM"
          />
          <!-- 비즈니스 단위 -->
          <i-select
            :label="$t('비즈니스 단위')"
            label-width="80px"
            width="300px"
            v-model="searchParams.BIZ_UNIT" 
            :items="codeList.BIZ_UNIT" 
            item-value="COD" 
            item-title="TXT"
          />
        </v-sheet>
        <div class="d-flex flex-column fill-height">
          <VRow>
            <VCol cols="12" md="4" class="ma-0 pa-0">
              <v-card class="overflow-y-auto pa-0">
                <v-card-title class="px-3 py-0">
                  <IGridTitle 
                    :title="$t('대분류')" 
                    :button-list="['btnCreate', 'btnDelete']" 
                    @click-button="onClickBtnT"
                  >
                    <template #editors />
                  </IGridTitle>
                </v-card-title>
                <v-card-text class="pa-3 pt-0 content-area">
                  <RealGrid
                    ref="grd1"
                    class="mt-0"
                    style="height: 600px"
                    :grid-view-option="grdProps1.gridViewOption"
                    :keys="grdProps1.keys"
                    :fields="grdProps1.fields"
                    :columns="grdProps1.columns"
                    @onCurrentRowChanged="searchMiddle"
                  />
                </v-card-text>
              </v-card>
            </VCol>
            <VCol cols="12" md="4" class="ma-0 pa-0" v-show="searchParams.CODE_GUBUN === 'DIV'">
              <v-card class="overflow-y-auto pa-0">
                <v-card-title class="px-3 py-0">
                  <IGridTitle 
                    :title="$t('중분류')" 
                    :button-list="['btnCreate', 'btnDelete']" 
                    @click-button="onClickBtnM"
                  >
                    <template #editors />
                  </IGridTitle>
                </v-card-title>
                <v-card-text class="pa-3 pt-0 content-area">
                  <RealGrid
                    ref="grd2"
                    class="mt-0"
                    style="height: 600px"
                    :grid-view-option="grdProps2.gridViewOption"
                    :keys="grdProps2.keys"
                    :fields="grdProps2.fields"
                    :columns="grdProps2.columns"
                    @onCurrentRowChanged="searchSmall" 
                  />
                </v-card-text>
              </v-card>
            </VCol>
            <VCol cols="12" md="4" class="ma-0 pa-0" v-show="searchParams.CODE_GUBUN === 'DIV'">
              <v-card class="overflow-y-auto pa-0">
                <v-card-title class="px-3 py-0">
                  <IGridTitle 
                  :title="$t('소분류')" 
                  :button-list="['btnCreate', 'btnDelete']" 
                  @click-button="onClickBtnS"
                  >
                    <template #editors />
                  </IGridTitle>
                </v-card-title>
                <v-card-text class="pa-3 pt-0 content-area">
                  <RealGrid
                    ref="grd3"
                    class="mt-0"
                    style="height: 600px"
                    :grid-view-option="grdProps3.gridViewOption"
                    :keys="grdProps3.keys"
                    :fields="grdProps3.fields"
                    :columns="grdProps3.columns"
                  />
                </v-card-text>
              </v-card>
            </VCol>
          </VRow>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
