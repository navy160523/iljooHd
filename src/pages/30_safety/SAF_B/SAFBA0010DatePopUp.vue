<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 허가서 작성 팝업   날짜 설정  -->

<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { useUserStore } from "@hiway/stores/user"
import Message from "@hiway/utils/notify"
const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const emit = defineEmits(["upData"])
const datainer = reactive([])
const grdTitle = ref(null)
const grdMain = ref(null)
const intdata = reactive({
  workDTTO: dayjs().add(1, "day").format("YYYY-MM-DD"),
  workDTFR: dayjs().add(3, "day").format("YYYY-MM-DD"),
  date: "one",
  workTimeTO: "08:00",
  workTimeFR: "16:59",
  OT: "N",
  URGENT: 'N',

})
const cntDay = ref("")
const isDan = ref("")
const intCode = () => {
  Promise.all([]).then((res) => {})
}
const UrgentChanged = ref(false)

// JOB_BSNS_CD  = 조선해양 / 특수선 && workRLC = 도크 /안벽/PE =
//  3일 else{내업 기타 단기공사 해양공사 } =7일

//  팝업 관련

const openPopup = async (popupParam, popupParam2, popupParam3) => {
  console.log(popupParam2, "popup2")
  //console.log("popupParam2 :::: " + popupParam2)

  cntDay.value = popupParam
  isDan.value = popupParam2
  intdata.URGENT = popupParam3 
  dialog.value = true
}

const onButtonsClick = (e) => {

  if (e.id === "btnRskCopyApp") {
    
    console.log("intdata.URGENT", intdata.URGENT)
    console.log("오늘?",  intdata.workDTTO)
    console.log("오늘?",  dayjs(intdata.workDTTO).isSame(dayjs().format("YYYY-MM-DD")))






    if (!intdata.workTimeFR || !intdata.workDTTO) {
      Message.warn(t("일수 설정부터 해주시기 바랍니다"))
      return
    }
    
    // 모든 공사는 이전 날짜 선택 불가능
    if(dayjs(intdata.workDTTO).isBefore(dayjs().format("YYYY-MM-DD"))) {
      Message.warn(
        t("작업기간은 이전날짜로 선택하실수 없습니다.")
      )
      return
    }
    

   // 단기공사 또는 당일긴급작업 제외하고는 오늘 날짜 선택 불가능
    if(  intdata.URGENT === 'N' && !isDan.value ) {
      if (dayjs(intdata.workDTTO).isSame(dayjs().format("YYYY-MM-DD"))) {      
        Message.warn(
          t("작업기간은 오늘날짜로 선택하실수 없습니다. 긴급작업 신청 버튼을 누르고 적용하세요.")
        )
        return      
      }

    }

    

    let start = dayjs(intdata.workDTTO)
    let end = dayjs(intdata.workDTFR)

    let addData = []

    while (start.isBefore(end) || start.isSame(end)) {
      let param = {
        workDT: start.format("YYYY-MM-DD"),
        workTimeTO: intdata.workTimeTO.replace(/:/g, ""),
        workTimeFR: intdata.workTimeFR.replace(/:/g, ""),
        OT: intdata.OT,
      }
      addData.push(param)
      start = start.add(1, "day")

      if (start.isAfter(end) || addData.length >= Number(cntDay.value)) {
        grdMain.value.getDataProvider().setRows(addData)
        return
      }
    }
  }

  // 24-11-04 한민규  긴급작업신청 추가하면서, 닫기를 활용한 악용 사례 가능성이 있어서 삭제함 . 
  if (e.id === "btnClose") {

    let data = grdMain.value.getDataProvider().getRows()

    if ((UrgentChanged.value)  && (data.length === 0) )  {
      Message.warn(t("긴급신청 여부 변경 후에는 적용 후 확인 버튼을 눌러주세요."))
      return 
    }

    close()
  }

  if (e.id === "btnChk") {


    let data = grdMain.value.getDataProvider().getRows()
    if (data.length === 0) {
      Message.warn(t("적용 후 확인 버튼을 눌러주세요."))
      return
    }
    
    console.log("btnChk", data)
    console.log("btnChk",  data.filter(row => row[4] === 'Y').length)

  
    // 25.01.13 윤찬양 책임 요청
    
    console.log(dayjs(intdata.workDTFR).diff(dayjs(), "day"))
      if (dayjs(intdata.workDTFR).diff(dayjs(), "day") >= 14) {
        Message.warn(t("14일 이후의 작업은 미리 신청 할 수 없습니다."))
        return

      }

    if (data.length ===  data.filter(row => row[4] === 'Y').length) {
      Message.warn(t("모든 작업일정을 제외 할 수 없습니다."))
      return
    }


   // 긴급작업이 아닌 경우 거르기 
    if (intdata.URGENT === 'Y'){
      if ((dayjs(intdata.workDTTO).isAfter(dayjs().add(1, 'day').format("YYYY-MM-DD"))) 
         || (dayjs(intdata.workDTTO).isSame(dayjs().add(1, 'day').format("YYYY-MM-DD")) && (dayjs().hour() < 15)))
          {      
            Message.warn(
              t("긴급작업 신청 대상이 아닙니다.")
            )
            return      
          }
    }


    for (let i of data) {
      const timePattern = /^([01]?[0-9]|2[0-3])([0-5][0-9])$/
      if (!timePattern.test(i[1])) {
        Message.warn(t("올바른 시간을 입력해주시기바랍니다"))
        return
      }
      if (!timePattern.test(i[2])) {
        Message.warn(t("올바른 시간을 입력해주시기바랍니다"))
        return
      }
    }

    let obj = []
    data.forEach((x, i) => {
      if (!obj[i]) {
        obj[i] = []

        obj[i].OT = x[3]
        obj[i].CANCELED_YN = (x[4] === undefined ? 'N':  x[4] )
        obj[i].time = `${x[1].substr(0, 2) + ":" + x[1].substr(2)} ~ ${
          x[2].substr(0, 2) + ":" + x[2].substr(2)
        }`

        obj[i].dt = `${dayjs(x[0]).format("MM")} / ${dayjs(x[0]).format("DD")}`

        obj[0].DN_DIV = intdata.date == "one" ? "D" : "N"

        obj[i].ALL_START_TIME = `${dayjs(x[0]).format(
          "YYYYMMDD"
        )}${x[1].replace(/:/g, "")}`

        obj[i].ALL_END_TIME = `${dayjs(x[0]).format("YYYYMMDD")}${x[2].replace(
          /:/g,
          ""
        )}`



      }

      console.log(x[i], "xx")
    })
    console.log('{obj:obj , urgent: intdata.URGENT}', {obj:obj , urgent: intdata.URGENT})
    emit("upData", {obj:obj , urgent: intdata.URGENT})
    close()
  }
}

const close = () => {
  UrgentChanged.value = false
  fstflag.value = true 
  dialog.value = false
}

const clearable = () => {}

// 그리드
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: true }, checkBar: { visible: false } },
  keys: ["BIRTHDAY", "NAME", "SOSOG_DESC"],
  fields: [
    {
      fieldName: "workDT",
      dataType: "text",

      header: { text: t("작업일") },
      editable: false,
    },
    {
      fieldName: "workTimeTO",
      dataType: "text",
      width: "80",
      header: { text: t("시작시각") },
      styleName: "editable_column",
      displayCallback: function (grd, idx, val) {
        let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)
        const timePattern = /^([01]?[0-9]|2[0-3])([0-5][0-9])$/
        if (!timePattern.test(data.workTimeTO)) {
          return (data.workTimeTO = "")
        }
        if (data.workTimeTO.length !== 4) {
          return (data.workTimeTO = "")
        }
        const hours = data.workTimeTO.substring(0, 2)
        const minutes = data.workTimeTO.substring(2)
        return (data.workTimeTO = `${hours}:${minutes}`)
      },
    },
    {
      fieldName: "workTimeFR",
      dataType: "text",
      width: "80",
      header: { text: t("종료시각") },
      styleName: "editable_column",
      displayCallback: function (grd, idx, val) {
        let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)
        const timePattern = /^([01]?[0-9]|2[0-3])([0-5][0-9])$/
        if (!timePattern.test(data.workTimeFR)) {
          return (data.workTimeFR = "")
        }
        if (data.workTimeFR.length !== 4) {
          return (data.workTimeFR = "")
        }
        const hours = data.workTimeFR.substring(0, 2)
        const minutes = data.workTimeFR.substring(2)
        return (data.workTimeFR = `${hours}:${minutes}`)
      },
    },
    {
      fieldName: "OT",
      dataType: "text",
      header: { text: t("연장") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      width: "40",
      editable: false,
      valueCallback: function (prod, dataRow, fieldName, fieldNames, values) {
        let workTimeFR = values[fieldNames.indexOf("workTimeFR")]
        let OT = values[fieldNames.indexOf("OT")]
        let limit = ""
        let reult = ""
        if (intdata.date === "one") {
          limit = "16:59"
          limit < workTimeFR ? (reult = "Y") : (reult = "N")
        } else {
          limit = "04:59"
          limit < workTimeFR ? (reult = "Y") : (reult = "N")
        }
        return reult
      },
    },
    {
      fieldName: "CANCELED_YN",
      dataType: "text",
      header: { text: t("일정제외") },
      renderer: { type: "check", trueValues: "Y", falseValues: "N" },
      width: "40",
    },



    {
      fieldName: "ALL_START_TIME",
      dataType: "text",
      visible: false,
    },
    {
      fieldName: "ALL_END_TIME",
      dataType: "text",
      visible: false,
    },
    {
      fieldName: "ALL_OVERTIME_YN",
      dataType: "text",
      visible: false,
    },
    {
      fieldName: "ALL_HOLLY_YN",
      dataType: "text",
      visible: false,
    },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

watch(
  () => intdata.date,
  (newValue) => {
    if (newValue === "one") {
      intdata.workTimeTO = "08:00"
      intdata.workTimeFR = "16:59"
    } else {
      intdata.workTimeTO = "20:00"
      intdata.workTimeFR = "04:59"
    }
  }
)

watch(
  () => intdata.workTimeFR,
  (newValue) => {
    let limit = ""
    if (intdata.date === "one") {
      limit = "16:59"
      limit < newValue ? (intdata.OT = "Y") : (intdata.OT = "N")
    } else {
      limit = "04:59"
      limit < newValue ? (intdata.OT = "Y") : (intdata.OT = "N")
    }
  }
)

watch(
  () => intdata.workDTTO,
  (newValue) => {
    console.log(newValue, "TOdd")

    // 2024-3-12 > 2024 -2-12 = null
    if (dayjs(newValue).isAfter(dayjs(intdata.workDTFR))) {
      intdata.workDTFR = newValue
    }
    if (cntDay.value == "7") {
      let limit = dayjs(intdata.workDTFR).subtract(6, "day")
      if (limit.isAfter(dayjs(newValue))) {
        Message.warn(t("7일 이하로 설정하실수 없습니다."))
        intdata.workDTTO = dayjs(intdata.workDTFR)
          .subtract(6, "day")
          .format("YYYY-MM-DD")
      }
    } else if(cntDay.value == "3"){
      let limit = dayjs(intdata.workDTFR).subtract(2, "day")
      if (limit.isAfter(dayjs(newValue))) {
        Message.warn(t("3일 이하로 설정하실수 없습니다."))
        intdata.workDTTO = dayjs(intdata.workDTFR)
          .subtract(2, "day")
          .format("YYYY-MM-DD")
      }
    } else {
      let limit = dayjs(intdata.workDTFR).subtract(0, "day")
      if (limit.isAfter(dayjs(newValue))) {
        Message.warn(t("1일 이하로 설정하실수 없습니다."))
        intdata.workDTTO = dayjs(intdata.workDTFR)
          .subtract(0, "day")
          .format("YYYY-MM-DD")
      }
    }
  }
)

watch(
  () => intdata.workDTFR,
  (newValue) => {
    console.log(newValue, "FR")
    if (dayjs(newValue).isBefore(dayjs(intdata.workDTTO))) {
      intdata.workDTTO = newValue
    }
    if (cntDay.value == "7") {
      let limit = dayjs(intdata.workDTTO).add(6, "day")
      if (limit.isBefore(dayjs(newValue))) {
        Message.warn(t("7일 이상으로 설정하실수 없습니다."))
        intdata.workDTFR = dayjs().format("YYYY-MM-DD")
      }
    } else if(cntDay.value == "3"){
      let limit = dayjs(intdata.workDTTO).add(2, "day")
      if (limit.isBefore(dayjs(newValue))) {
        Message.warn(t("3일 이상으로 설정하실수 없습니다."))
        intdata.workDTFR = dayjs().format("YYYY-MM-DD")
      }
    } else {
      let limit = dayjs(intdata.workDTTO).add(0, "day")
      if (limit.isBefore(dayjs(newValue))) {
        Message.warn(t("1일 이상으로 설정하실수 없습니다."))
        intdata.workDTFR = dayjs().format("YYYY-MM-DD")
      }
    }
  }
)
const fstflag = ref(true)
watch(
  () => intdata.URGENT,
  (newValue ) => {

  grdMain.value.getDataProvider().setRows(null)
  fstflag.value = false 
  console.log('바꿈',  fstflag.value)



  if(!fstflag.value){
    UrgentChanged.value = true
  }

  }



)





watch(
  () => grdMain.value,
  (newValue) => {
    if (newValue) {
      grdMain.value.getDataProvider().setRows(null)
    }
  }
)

// 그리드 이벤트

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="800"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>작업일시 설정</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnRskCopyApp', 'btnChk', 'btnClose']" 
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <v-sheet>
          <div class="d-flex align-center">
            <i-input
              :label="t('작업기간')"
              type="date"
              margin="4px"
              width="200px"
              v-model="intdata.workDTTO"
            />
            <i-input
              :label="t('~')"
              type="date"
              margin="4px"
              width="160px"
              v-model="intdata.workDTFR"
            />
            <span
             style="margin-right: 10px;">
              {{ t(`(최대 연속 ${cntDay}일)`) }}
            </span>

            <v-checkbox
              v-show="!isDan"
              true-value="Y"
              false-value="N"
              :label="$t('긴급작업 신청(안전 승인확정 필요)')"
              v-model="intdata.URGENT"
            />


          </div>

          <div class="d-flex align-center mt-3">
            <span style="margin-right: 10px">{{ t("주야 구분") }}</span>
            <div style="width: 150px">
              <v-radio-group
                inline
                style="margin-right: 10px"
                v-model="intdata.date"
              >
                <v-radio label="주간" value="one"></v-radio>
                <v-radio label="야간" value="two"></v-radio>
              </v-radio-group>
            </div>
            <i-input
              :label="t('')"
              margin="4px"
              width="130px"
              type="Time"
              v-model="intdata.workTimeTO"
            />
            <i-input
              :label="t('~')"
              margin="4px"
              width="140px"
              type="Time"
              v-model="intdata.workTimeFR"
            />
            <v-checkbox
              true-value="Y"
              false-value="N"
              disabled
              :label="$t('연장')"
              v-model="intdata.OT"
            />

          </div>
          <div>
            <span style="color: #ef5350; font-size: 12px"
              >(주:08:00 ~ 16:59 , 주(연장):17:00 ~ 23:59/ 야:20:00 ~ 익일
              04:59, 야(연장):익일:05:00 ~ 07:59)</span
            >
          </div>
          <div>
            <span style="color: #ef5350; font-size: 12px" class="my-2"
              >※ 작업사업부가 조선/해양에너지/특수선인 경우 위험작업의 장소가
              도크, 안벽, PE장인 경우 연속 3일까지 신청 가능<br />
              (그외는 최대 7일 내업, 기타, 단기공사, 해양공사는 최대 연속
              7일까지 신청 가능)</span
            >
          </div>
        </v-sheet>

        <v-card class="mt-3">
          <v-card-text class="pa-0">
            <RealGrid
              class="mt-1"
              ref="grdMain"
              style="height: calc(100vh - (800px))"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
            />
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (590px));
  overflow-y: auto;
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}

.rg-rowfocus {
            background: none !important; /* 배경색 없애기 */
        }

</style>
