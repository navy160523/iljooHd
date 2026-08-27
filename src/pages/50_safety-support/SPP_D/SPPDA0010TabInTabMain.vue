<!-- SPPDA0010Tab1위험기계기구 안전검사 기본정보/인증검사현황/정보변경이력 MainTab-->
<!-- SI2팀 김성근 2024-04-03  -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import TabInTab1 from "@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1.vue"
import TabInTab2 from "@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab2.vue"
import TabInTab3 from "@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab3.vue"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const emit = defineEmits(["updata", "DataReSet"])
const tabInTab = ref(null)
const grdMain = ref(null)
const SaveFlag1 = ref(false)
const SaveFlag2 = ref(false)
const SaveFlag3 = ref(false)

const dataFlag1 = ref(false)
const dataFlag2 = ref(false)
const dataFlag3 = ref(false)

const reset = ref(false)

const intData = ref([])
const btnListTab = reactive([
  { name: "저장", id: "Save", disabled: false },
  { name: "신규", id: "New", disabled: false },
  { name: "삭제", id: "Del", disabled: false },
  { name: "확인완료", id: "CFM", disabled: false },
])

const props = defineProps({
  clickData: {
    type: Object,
    required: false,
    default() {
      return {}
    },
  },
  tab: {
    type: String,
    default: "",
  },
})

//  이벤트 시작
const onButtonsClick = (btn) => {
  if (btn == "Save") {
    if (tabInTab.value === "one") {
      SaveFlag1.value = true
    }
    if (tabInTab.value === "two") {
      SaveFlag2.value = true
    }
  }
  if (btn == "CFM") {
    if (tabInTab.value === "three") {
      SaveFlag3.value = true
    }
  }

  if (btn == "New") {
    console.log(reset.value, "reset.value")
    tabInTab.value = "one"
    reset.value = true
    emit("DataReSet")
  }
  if (btn == "Del") {
    new deleteFlowHelper(vm, t)
      .setBefore(delChek)
      .setQuery(delData)
      .setAfter(() => emit("updata"))
      .run()
  }
}

// 텝1 저장
const saveFlagFalse = (e) => {
  intData.value = []
  let SaveParam = []
  SaveFlag1.value = false
  if (!e) {
    return
  }
  SaveParam.push(e)
  for (let i in SaveParam) {
    intData.value[i] = SaveParam[i]
  }
  dataFlag1.value = true
  SaveData()
}
// 텝2 저장
const saveData = (e) => {
  intData.value = []
  SaveFlag2.value = false
  if (!e) {
    return
  }

  for (let i in e) {
    intData.value[i] = e[i]
  }

  dataFlag2.value = true
  SaveData()
}
// 텝3 저장
const saveDataThree = (e) => {
  intData.value = []
  SaveFlag3.value = false
  if (!e) {
    return
  }
  for (let i in e) {
    intData.value[i] = e[i]
  }
  dataFlag3.value = true
  SaveData()
}

// 저장
const SaveData = () => {
  new saveFlowHelper(vm, t)
    .setBefore(checkData)
    .setQuery(saveDatas)
    .setAfter(() => {
      emit("updata")
    })
    .run()
}
const checkData = () => {
  return true
}

const saveDatas = () => {
  let param = []

  for (let i in intData.value) {
    param[i] = intData.value[i]
  }
  console.log(param, "intData.value")

  if (dataFlag1.value) {
    if (param[0].INSTALL_DT) {
      param[0].INSTALL_DT = dayjs(param[0].INSTALL_DT).format("YYYYMMDD")
      
    }
    // console.log(param[0].INSTALL_DT,'dddzxcdfsf4zsd5f12asd1f23sd4f52asd123vzxc1v23zxc')
    param[0].TEST_TYPE = '기본'
    console.log('param', param)
    dataFlag1.value = false
    return commonExecuteApi({ queryId: "SPPDA0010_SAVE_01", list: param }) 
  }


  if (dataFlag2.value) {
    dataFlag2.value = false
    return commonExecuteApi({ queryId: "SPPDA0010_SAVE_03", list: param })
  }

  if (dataFlag3.value) {
    dataFlag3.value = false
    return commonExecuteApi({ queryId: "SPPDA0010_SAVE_02", list: param })
  }
}

// 삭제
const delChek = () => {
  if (props.clickData.length == 0) {
    Message.warn(t("선택된 데이터가 없습니다."))
    return false
  }
  return true
}
const delData = () => {
  let param = [
    {
      CMPNY_DIV: props.clickData.CMPNY_DIV,
      EQUIP_KIND: props.clickData.EQUIP_KIND,
      EQUIP_SEQ: props.clickData.EQUIP_SEQ,
    },
  ]
  return commonExecuteApi({ queryId: "SPPDA0010_DELETE_01", list: param }).then(
    (res) => {
      emit("DataReSet")
    }
  )
}

// 신규텝

// 버튼컨트롤
watch(
  () => tabInTab.value,
  (newValue) => {
    if (newValue === "three") {
      for (let i of btnListTab) {
        if (i.name === "저장") {
          i.disabled = true
        }
        if (i.name === "확인완료") {
          i.disabled = false
        }
      }
    } else {
      for (let i of btnListTab) {
        if (i.name === "저장") {
          i.disabled = false
        }
        if (i.name === "확인완료") {
          i.disabled = true
        }
      }
    }
  }
)
</script>

<template>
  <!-- 텝 -->
  <VTabs v-model="tabInTab">
    <VTab value="one">기본정보</VTab>
    <VTab value="two">인증/검사현황</VTab>
    <VTab value="three">정보변경이력</VTab>
    <v-spacer />
    <v-btn
      style="width: 80px !important; padding: 0px !important"
      v-for="(item, i) in btnListTab"
      :key="i"
      @click="onButtonsClick(item.id)"
      :disabled="item.disabled"
    >
      {{ item.name }}
    </v-btn>
  </VTabs>
  <!-- 텝아이템 -->
  <VWindow v-model="tabInTab">
    <VWindowItem value="one">
      <TabInTab1
        :SaveFlag="SaveFlag1"
        @saveFlagFalse="saveFlagFalse($event)"
        :tab="tab"
        :clickData="props.clickData"
      />
    </VWindowItem>
    <VWindowItem value="two">
      <TabInTab2
        :SaveFlag2="SaveFlag2"
        :tab="tabInTab"
        @saveData="saveData($event)"
        :clickData="props.clickData"
        :resetClick="reset"
      />
    </VWindowItem>
    <VWindowItem value="three">
      <TabInTab3
        :SaveFlag3="SaveFlag3"
        :tab="tabInTab"
        @saveDataThree="saveDataThree($event)"
        :clickData="props.clickData"
        :resetClick="reset"
        @resetValue="reset = false"
      />
    </VWindowItem>
  </VWindow>
</template>
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 355px);
}
</style>
