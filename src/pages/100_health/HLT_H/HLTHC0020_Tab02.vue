<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  computed,
  onBeforeMount,
  nextTick,
} from "vue";
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  getCompanyList,
} from "@hiway/api/commonApi";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import Message from "@hiway/utils/notify";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@hiway/stores/user";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from "@/utils/saveFlowHelper";
import dayjs from "dayjs";
import HLTHC0020Tab02Popup from "./HLTHC0020_Tab02_Popup.vue";

const grdMain = ref(null);
const grdExcel = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const sortGrd = ref([]);
const tab02Popup = ref();

const props = defineProps({
  isAdmin: Number,
  cmpnyDiv: String,
  year: String,
  reqDiv: String,
  reqCha: String,
});

const codeList = reactive({
  USER_DIV: [
    { COD: "A", TXT: "직영", DISABLE: false },
    { COD: "B", TXT: "사내협력사", DISABLE: false },
  ],
  EYESIGHT_PLACE: [],
  TIME: [],
});

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: "",
  REQ_DIV: "A",
  DEPT_CD: "",
  USER_DIV: "%",
});

const printParam = reactive({
  CMPNY_DIV: "",
  YEAR: "",
  REQ_DIV: "",
  REQ_CHA: "",
});

const inputparam = reactive({
  EYESIGHT_PLACE: "",
  EYESIGHT_DT: "",
  ST_TIME: "08:00",
  EN_TIME: "17:00",
});

const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
  },
  fields: [
    {
      name: "rowCheck",
      fieldName: "checked",
      type: "data",
      width: 20,
      header: {
        text: " ",
        checkLocation: "left",
      },
      sortable: false,
      renderer: {
        type: "check",
        trueValues: "Y",
        falseValues: "N",
      },
      editor: {
        type: "check",
        trueValues: "Y",
        falseValues: "N",
      },
      styleCallback: function (grid, dataCell) {
        const dataRow = dataCell.index.dataRow;
        if (dataRow < 0) return;

        // const dutyYn = grid.getValue(dataRow, "DUTY_YN");
        // const cmpnyDiv = grid.getValue(dataRow, "CMPNY_DIV");

        //const isEditable = !(dutyYn === "N" || cmpnyDiv === "320");

        const ret = {
          editable: true, // 항상 true 유지 → 회색 안 됨
        };

        // if (!isEditable) {
        //   //ret.editor = null; // ✅ 체크 불가 처리 (UI는 회색 아님)
        //   ret.renderer = { type: "check", editable: false };
        // } else {
        //   ret.renderer = { type: "check", editable: true };
        // }

        ret.renderer = { type: "check", editable: false };

        return ret;
      },
    },
    {
      fieldName: "USER_DIV",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("구분") },
      styleName: "center-column",
    },
    {
      fieldName: "ASGN_FULL_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("조직") },
      styleName: "left-column",
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("사번") },
      styleName: "left-column",
    },
    {
      fieldName: "EMP_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("이름") },
      styleName: "left-column",
    },
    {
      fieldName: "JOB_TIT_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직위") },
      styleName: "left-column",
    },
    {
      fieldName: "EYESIGHT_PLACE",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("검사장소") },
      styleName: "left-column",
    },
    {
      fieldName: "EYESIGHT_DT",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("검사일자") },
      styleName: "center-column",
    },
    {
      fieldName: "EYESIGHT_TIME",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("검사시간") },
      styleName: "center-column",
    },
    {
      fieldName: "CMPNY_DIV",
      visible: false,
    },
    {
      fieldName: "YEAR",
      visible: false,
    },
    {
      fieldName: "REQ_DIV",
      visible: false,
    },
    {
      fieldName: "REQ_CHA",
      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    "rowCheck",
    "USER_DIV",
    "ASGN_FULL_NM",
    "EMP_NO",
    "EMP_NM",
    "JOB_TIT_NM",
    "EYESIGHT_PLACE",
    "EYESIGHT_DT",
    "EYESIGHT_TIME",
  ],
});

grdMainProps.columns = grdMainProps.fields;

const grdExcelProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
  },
  fields: [
    {
      fieldName: "ASGN_FULL_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("조직") },
      styleName: "left-column",
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("사번") },
      styleName: "left-column",
    },
    {
      fieldName: "EMP_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("이름") },
      styleName: "left-column",
    },
    {
      fieldName: "JOB_TIT_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직위") },
      styleName: "left-column",
    },
    {
      fieldName: "UNT_DUTY_NM",
      dataType: "text",
      width: "100",
      editable: false,
      header: { text: t("직무") },
      styleName: "left-column",
    },
    {
      fieldName: "DUTY_YN",
      dataType: "text",
      width: "60",
      editable: false,
      header: { text: t("대상") },
      styleName: "center-column",
    },
    {
      fieldName: "PLACE_NAME",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("시력검사장소") },
      styleName: "left-column",
    },
    {
      fieldName: "EYESIGHT_DT",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("시력검사일자") },
      styleName: "center-column",
    },
    {
      fieldName: "EYESIGHT_TIME",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("시력검사시간") },
      styleName: "center-column",
    },
    {
      fieldName: "REMARKS",
      dataType: "text",
      width: "100",
      editable: false,
      lookupDisplay: true,
      header: { text: t("비고") },
      styleName: "left-column",
    },
  ],
  columns: [],
  columnLayout: [],
});

grdExcelProps.columns = grdExcelProps.fields;

const initCodeList = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0020_SEARCH_PLACE",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }),
  ]);

  codeList.EYESIGHT_PLACE = res[0].ORESULT_CUR;

  console.log('codeList.EYESIGHT_PLACE : ', codeList.EYESIGHT_PLACE)

  grdMain.value.setBindingColumn("USER_DIV", codeList.USER_DIV, "COD", "TXT");
  grdMain.value.setBindingColumn(
    "EYESIGHT_PLACE",
    codeList.EYESIGHT_PLACE,
    "COD",
    "TXT"
  );
};

const setLoad = async () => {
  grdMain.value.getGridView().onShowEditor = function (grid, index) {
    return false;
  };

  setTimeout(() => {
    grdMain.value.getGridView().refresh();
  }, 100);
  return true;
};

onMounted(async () => {
  await initCodeList();
  grdMain.value.getGridView().filterPanel.visible = true;
  await nextTick();
});

const searchData = async () => {
  //userData
  new queryFlowHelper(vm, t)
    .setQuery(() => searchDatas())
    .setAfter(afterSearch)
    .run(); //userData
};

const searchDatas = () => {
  //userData
  return commonSearchApi({
    queryId: "HLTHC0020_SEARCH_04",
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: props.year,
      REQ_DIV: props.reqDiv,
      REQ_CHA: props.reqCha,
    },
  });
};

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
  // const sortData = [...res.ORESULT_CUR]
  // sortGrd.value = sortData.sort((a, b) =>
  //   a.EMP_NO.localeCompare(b.EMP_NO)
  // )
};

const onButtonsClick = async (btn) => {
  if (props.isAdmin <= 0) {
    return Message.warn(
      t("권한이 없습니다. 보건관리팀 담당자에게 문의하세요.")
    );
  }

  if (btn.id === "btnSelectListCollApply") {
    if (inputparam.EYESIGHT_PLACE === "" || inputparam.EYESIGHT_DT === "") {
      return Message.warn(t("시력검사장소 및 검사일자를 확인해주세요."));
    }

    if (grdMain.value.getDataProvider().getRowCount() <= 0) {
      return Message.warn(t("적용할 대상이 없습니다."));
    }
    await setSelectList(assignRoundedTimeSlots());
    setTimeout(() => {
      grdMain.value.getGridView().refresh();
    }, 100);
  } else if (btn.id === "btnScheduleEstablishment") {
    await saveData();
  } else if (btn.id === "btnScheduleNoticePrint") {
    await onExceldown();
  } else if (btn.id === "btnEyesightScheduleSetting") {
    tab02Popup.value.openPopup(props);
  }
};

const onExceldown = async () => {
  const res = await Promise.all([
    commonSearchApi({
      queryId: "HLTHC0020_SEARCH_06",
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        YEAR: props.year,
        REQ_DIV: props.reqDiv,
        REQ_CHA: props.reqCha,
      },
    }),
  ]);

  await grdExcel.value.getDataProvider().setRows(res[0].ORESULT_CUR);

  let title = props.reqCha + "월 도수보안경 정기분 시력검사 일정";

  grdExcel.value.getGridView().exportGrid({
    type: "excel",
    target: "local",
    lookupDisplay: true,
    fileName: title + ".xlsx", // 저장될 파일 name
    progressMessage: "엑셀 다운로드중입니다.", // 엑셀 다운로드 하는 동안 progressMessage 표시
    indicator: "hidden", // indidator 영역 표시
    header: "visible", // 헤더 표시
    footer: "visible", // footer 표시하지 않음
    allColumns: false, // visible : false 인 행도 표시할 것인지 여부
    exportGrids: [{ grid: grdExcel.value.getGridView(), sheetName: "정기" }],
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t("엑셀 다운로드가 완료되었습니다."));
    },
  });
};

const saveData = async () => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveDatas)
    .setAfter(afterSave)
    .run();
};

const getCustomCheckedRows = async () => {
  const dataProvider = grdMain.value.getDataProvider();
  const rowCount = dataProvider.getRowCount();

  const checkedIndexes = [];

  for (let i = 0; i < rowCount; i++) {
    const value = dataProvider.getValue(i, "checked");
    if (value === "Y" || value === true || value === "true") {
      checkedIndexes.push(i); // ✅ 인덱스만 push
    }
  }
  return checkedIndexes;
};

const beforeSave = async () => {
  let checkedData = await getCustomCheckedRows(); //grdMain.value.getGridView().getCheckedRows(true);

  // console.log('???? : ',checkedData )
  if (checkedData.length === 0) {
    Message.warn(t("일정수립 할 데이터가 없습니다."));
    return false;
  }
  return true;
};

const saveDatas = async () => {
  let temp = null;
  let checkedRows = await getCustomCheckedRows(); //grdMain.value.getGridView().getCheckedRows(true);

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx);
    let saveParam = [];
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV,
      YEAR: data.YEAR,
      REQ_DIV: data.REQ_DIV,
      REQ_CHA: data.REQ_CHA,
      EYESIGHT_DT: dayjs(data.EYESIGHT_DT).format("YYYYMMDD"),
      EYESIGHT_TIME: data.EYESIGHT_TIME.replace(":", ""),
      EMP_NO: data.EMP_NO,
    };
    saveParam.push(saveData);

    temp = commonExecuteApi({
      queryId: "HLTHC0020_SAVE_02",
      list: saveParam,
    });
  }

  return temp;
};

const afterSave = () => {
  uncheckAll();
};

const uncheckAll = async () => {
  const dataProvider = grdMain.value.getDataProvider();
  const rowCount = dataProvider.getRowCount();

  for (let i = 0; i < rowCount; i++) {
    dataProvider.setValue(i, "checked", "N");
  }
};

const setSelectList = async (timeSlots) => {
  // for(var i = 0; i < sortGrd.value.length; i++){
  //   const row = sortGrd.value[i];

  //   if(row.EYESIGHT_PLACE == inputparam.EYESIGHT_PLACE){

  //     sortGrd.value[i].EYESIGHT_DT = inputparam.EYESIGHT_DT
  //     sortGrd.value[i].EYESIGHT_TIME = timeSlots[i]
  //   }
  // }

  const dataProvider = grdMain.value.getDataProvider();

  // const inputMap = new Map(
  //   sortGrd.value.map(item => [item.EMP_NO, item])
  // )

  // const rowCount = dataProvider.getRowCount();

  // for(let rowIndex = 0; rowIndex < rowCount; rowIndex++){
  //   const empNo = dataProvider.getValue(rowIndex, 'EMP_NO');
  //   const newData = inputMap.get(empNo)

  //   if(newData){
  //     dataProvider.setValue(rowIndex, 'EYESIGHT_DT',   newData.EYESIGHT_DT);
  //     dataProvider.setValue(rowIndex, 'EYESIGHT_TIME', newData.EYESIGHT_TIME);
  //   }
  // }

  // grdMain.value.getView().reload();

  let timeCnt = 0;

  for (var i = 0; i < dataProvider.getRowCount(); i++) {
    if (
      dataProvider.getValue(i, "EYESIGHT_PLACE") === inputparam.EYESIGHT_PLACE
    ) {
      dataProvider.setValue(i, "EYESIGHT_DT", inputparam.EYESIGHT_DT);
      dataProvider.setValue(i, "EYESIGHT_TIME", timeSlots[timeCnt++]);

      // const row = grdMain.value.getGridView().getDataRow(i)
      // console.log('row : ',row)
      // grdMain.value.getGridView().checkRow(row)

      grdMain.value.getDataProvider().setValue(i, "checked", true);
    }
  }
};

const parseTime = (timeStr) => {
  const [hour, minute] = [
    Number(timeStr.slice(0, 2)),
    Number(timeStr.slice(2, 4)),
  ]; //timeStr.split(":").map(Number);
  return hour * 60 + minute;
};

const formatTime = (minutes) => {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const min = String(minutes % 60).padStart(2, "0");
  return `${hour}:${min}`;
};

const assignTimeSlots = async () => {
  const provider = grdMain.value.getGridView().getDataSource();
  const jsonRows = provider.getJsonRows();
  const aRows = jsonRows.filter(
    (rowObj) => rowObj.EYESIGHT_PLACE === inputparam.EYESIGHT_PLACE
  );

  const start = parseTime(inputparam.ST_TIME);
  const end = parseTime(inputparam.EN_TIME);
  const interval = 30;
  const slotCount = Math.floor((end - start) / interval);
  const totalEmployees = aRows.length;

  const baseCount = Math.floor(totalEmployees);
  let remaining = totalEmployees % slotCount;

  const timeSlots = [];
  let current = start;

  for (let i = 0; i < slotCount; i++) {
    const count = baseCount + (remaining > 0 ? 1 : 0);
    remaining--;

    for (let j = 0; j < count; j++) {
      timeSlots.push(formatTime(current));
    }
    current += interval;
  }

  return timeSlots;
};
//function
const assignRoundedTimeSlots = async (data) => {
  const provider = grdMain.value.getGridView().getDataSource();
  const jsonRows = provider.getJsonRows();

  //----검사장소별 분류---------------------------------------------------------------------------------------
  let placeFilerData = reactive({});
  let placePeaple = reactive({});

  for (let i = 0; i < codeList.EYESIGHT_PLACE.length; i++) {
    const tempData = data.filter(
      (rowObj) => rowObj.PLACE_SEQ === codeList.EYESIGHT_PLACE[i].COD
    );
    const aRows = jsonRows.filter(
      (rowObj) => rowObj.EYESIGHT_PLACE === codeList.EYESIGHT_PLACE[i].COD
    );
    if (tempData.length) {
      placeFilerData[codeList.EYESIGHT_PLACE[i].COD] = tempData;
      placePeaple[codeList.EYESIGHT_PLACE[i].COD] = aRows;
    }
  }
  //-------------------------------------------------------------------------------------------
  let returnData = [];
  for (let key in placeFilerData) {
    const temp = allocateByDuration(placeFilerData[key], placePeaple[key]);
    returnData.push(temp);
    // console.log('temp : ', temp)
    // for(let i = 0; i < placeFilerData[key].length; i++){

    // }
  }
  //console.log('111 : ', placeFilerData)
  return returnData;
};

const hhmmToMin = (hhmm) => {
  const h = parseInt(hhmm.slice(0, 2), 10);
  const m = parseInt(hhmm.slice(2, 4), 10);
  return h * 60 + m;
};

const rangeLen = (r) => {
  const s = hhmmToMin(r.EYESIGHT_ST_TIME.replace(":", ""));
  const e = hhmmToMin(r.EYESIGHT_ED_TIME.replace(":", ""));
  return e >= s ? e - s : e + 1440 - s; // 자정 넘김 처리
};

function allocateByDuration(groups, people) {
  // 1) 각 그룹 총길이(분)
  const lens = groups.map((g) => [g].reduce((sum, r) => sum + rangeLen(r), 0));
  const total = lens.reduce((a, b) => a + b, 0);
  if (total === 0) return; //groups.map(g => ({ name: g.name, people: 0, ratio: 0 }));

  // 2) 비율배분 + 최대잔여
  const raws = lens.map((len) => (people.length * len) / total);
  const floorAlloc = raws.map(Math.floor);
  let left = people.length - floorAlloc.reduce((a, b) => a + b, 0);
  const remainders = raws
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const result = floorAlloc.slice();
  for (let k = 0; k < left; k++) result[remainders[k].i]++;

  // 3) 결과
  return groups.map((g, i) => ({
    date: g.EYESIGHT_DT,
    place: g.PLACE_SEQ,
    st: g.EYESIGHT_ST_TIME,
    ed: g.EYESIGHT_ED_TIME,
    // minutes: lens[i],
    // ratio: lens[i] / total,
    people: result[i],
  }));
  //console.log('결과 : ', result)
}

//date: '2025-08-08', place: '17', people: 2
//function
const assignRoundedTimeSlotsDetail = async (data) => {
  if (data.length <= 0) return;
  

  for (let i = 0; i < data.length; i++) {
    let returnData = [];
    const provider = grdMain.value.getGridView().getDataSource();
    const jsonRows = provider.getJsonRows();
    const aRows = jsonRows.filter(
      (rowObj) => rowObj.EYESIGHT_PLACE === data[i][0].place
    );
    if (aRows.length <= 0) {
      continue;
    }

    // let totalCnt = 0;

    for (let j = 0; j < data[i].length; j++) {
      const start = parseTime(data[i][j].st);
      const end = parseTime(data[i][j].ed);
      const interval = 30;
      const totalEmployees = data[i][j].people;

      // console.log('뀨? : ', start)
      // console.log('뀨뀨? : ', end)

      // 1. 가능한 시간 슬롯들 (30분 단위)
      const allSlotsH = [];
      const allSlotsM = [];
      for (let t = start; t < end; t += 60) {
        allSlotsH.push(t);
      }
      for (let t = start; t < end; t += interval) {
        allSlotsM.push(t);
      }
      const slotCountH = allSlotsH.length;
      const slotCountM = allSlotsM.length;

      // console.log('뀨? : ', allSlotsH)
      // console.log('뀨뀨? : ', allSlotsM)

      if (totalEmployees <= slotCountH) {
        const selected = allSlotsH.slice(0, totalEmployees);
        //return selected.map(formatTime);
        returnData.push(selected.map(formatTime));
      } else if (totalEmployees <= slotCountM) {
        const selected = allSlotsM.slice(0, totalEmployees);
        // times.push(selected.map(formatTime));
        returnData.push(selected.map(formatTime));
      } else {
        // 3. 인원이 많으면 슬롯을 반복해서 분배
        const times = [];
        let i = 0;
        for (let n = 0; n < totalEmployees; n++) {
          times.push(formatTime(allSlotsM[i]));
          i = (i + 1) % slotCountM;
        }
        const sortedTimes = [...times].sort();
        returnData.push(sortedTimes);
      }
    }


    // let timeCnt = 0;
    let dateCnt = 0;
    let receiveCnt = 0;
    let totalCnt = 0;
    const dataProvider = grdMain.value.getDataProvider();

    //
    for (var j = 0; j < dataProvider.getRowCount(); j++) {
      // console.log('receiveCnt : ', receiveCnt)
      // console.log('data[i][dateCnt].length : ', returnData[receiveCnt].length)
      if (returnData[dateCnt]) {
        if (receiveCnt + totalCnt >= returnData[dateCnt].length + totalCnt) {
          totalCnt += returnData[dateCnt++].length;
          receiveCnt = 0;
        }

        if (dataProvider.getValue(j, "EYESIGHT_PLACE") === data[i][0].place) {
          // console.log('타나?? : ', data[i][dateCnt])
          dataProvider.setValue(j, "EYESIGHT_DT", data[i][dateCnt].date);
          dataProvider.setValue(
            j,
            "EYESIGHT_TIME",
            returnData[dateCnt][receiveCnt++]
          );
          grdMain.value.getDataProvider().setValue(j, "checked", true);
        }
      }
    }
  }
  // console.log('결과 : ',returnData)
};

function assignRoundedTimeSlots_back() {
  const provider = grdMain.value.getGridView().getDataSource();
  const jsonRows = provider.getJsonRows();
  const aRows = jsonRows.filter(
    (rowObj) => rowObj.EYESIGHT_PLACE === inputparam.EYESIGHT_PLACE
  );

  const start = parseTime(inputparam.ST_TIME);
  const end = parseTime(inputparam.EN_TIME);
  const interval = 30;
  //const slotCount = Math.floor((end - start) / interval);
  const totalEmployees = aRows.length;

  if (totalEmployees <= 0) {
    return Message.warn(t("적용할 대상이 없습니다."));
  }

  // 1. 가능한 시간 슬롯들 (30분 단위)
  const allSlotsH = [];
  const allSlotsM = [];
  for (let t = start; t < end; t += 60) {
    allSlotsH.push(t);
  }

  for (let t = start; t < end; t += interval) {
    allSlotsM.push(t);
  }

  const slotCountH = allSlotsH.length;
  const slotCountM = allSlotsM.length;

  if (totalEmployees <= slotCountH) {
    const selected = allSlotsH.slice(0, totalEmployees);
    return selected.map(formatTime);
  } else if (totalEmployees <= slotCountM) {
    const selected = allSlotsM.slice(0, totalEmployees);
    return selected.map(formatTime);
    // 2. 적은 인원이면 가능한 시간 슬롯에서 균등 간격으로 추출
    // const step = (slotCountM - 1) / (totalEmployees - 1);
    // return Array.from({ length: totalEmployees }, (_, i) =>
    //   formatTime(slotCountM[Math.round(i * step)])
    // );
  } else {
    // 3. 인원이 많으면 슬롯을 반복해서 분배
    const times = [];
    let i = 0;
    for (let n = 0; n < totalEmployees; n++) {
      times.push(formatTime(allSlotsM[i]));
      i = (i + 1) % slotCountM;
    }
    const sortedTimes = [...times].sort();
    return sortedTimes;
  }
}

const onScheduleSelected = async (data) => {
  const rowCount = grdMain.value.getDataProvider().getRowCount();
  if (!rowCount > 0) {
    return Message.warn(t("적용할 대상이 없습니다."));
  }

  const slotData = await assignRoundedTimeSlots(data);

  const slotDataDetail = await assignRoundedTimeSlotsDetail(slotData);

  // await setSelectList(assignRoundedTimeSlots(data));
  // setTimeout(() => {
  //   grdMain.value.getGridView().refresh();
  // }, 100);
};

defineExpose({
  searchData,
  setLoad,
});
</script>

<template>
  <v-card class="pa-0 fil-height">
    <v-card-title class="pa-3 pb-0" style="justify-content: space-between">
      <IMenuTitle
        ref="menuTitle01"
        :title="$t('신청자 일정')"
        :usePermission="false"
        :button-list="[
          'btnEyesightScheduleSetting',
          'btnScheduleEstablishment',
          'btnScheduleNoticePrint',
        ]"
        :hiddenManuel="true"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 'btnSelectListCollApply', -->
    <!-- <v-card-text class="pa-3 searchArea">
      <div class="d-flex flex-gap">
        <span class="custom-flex-3" />
        <i-select
          :label="$t('시력검사장소')"
          :items="codeList.EYESIGHT_PLACE"
          item-title="TXT"
          item-value="COD"
          class="custom-flex-2"
          labelWidth="80px"
          v-model="inputparam.EYESIGHT_PLACE"
        />
        <i-input
          :label="$t('검사일자')"
          type="date"
          class="custom-flex-1"
          labelWidth="60px"
          v-model="inputparam.EYESIGHT_DT"
        />
        <i-input
          :label="$t('시작시간')"
          type="time"
          class="custom-flex-1"
          labelWidth="60px"
          v-model="inputparam.ST_TIME"
        />
        <i-input
          :label="$t('종료시간')"
          type="time"
          class="custom-flex-1"
          labelWidth="60px"
          v-model="inputparam.EN_TIME"
        />
      </div>
    </v-card-text> -->
    <v-card-text class="pa-0 pt-3 content-area">
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
            <RealGrid
              v-show="false"
              ref="grdExcel"
              :grid-view-option="grdExcelProps.gridViewOption"
              :fields="grdExcelProps.fields"
              :columns="grdExcelProps.columns"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <HLTHC0020Tab02Popup ref="tab02Popup" @selected="onScheduleSelected" />
  <!-- <HLTHA0020Popup02 ref="hLTHA0020Popup02" /> -->
  <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (424px));
  overflow-y: auto;
}
.tooltip-wrapper {
  position: absolute;
}
.tooltip {
  position: relative; /* 화살표가 툴팁 아래에 위치하도록 */
  background-color: #424242;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  z-index: 1000; /* 툴팁이 다른 요소 위에 보이도록 */
  pointer-events: none; /* 툴팁이 마우스 이벤트를 받지 않도록 */
  white-space: nowrap; /* 내용이 줄바꿈되지 않도록 */
}

.tooltip-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent; /* 화살표의 왼쪽 부분 */
  border-right: 5px solid transparent; /* 화살표의 오른쪽 부분 */
  border-top: 5px solid #424242; /* 화살표의 색상 */
  position: absolute;
  left: 50%; /* 가운데 정렬 */
  transform: translateX(-50%); /* 수평 중심으로 이동 */
  top: 100%; /* 툴팁 아래에 위치 */
}

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