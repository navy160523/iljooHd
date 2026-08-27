<script setup>
import initButtonItems from '@/utils/buttonList'
import PdfView from '@/pages/99_indexPopUp/PdfViewPopup.vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { commonSearchApi } from '@hiway/api/commonApi'
import { ref, onMounted, getCurrentInstance } from 'vue'
import _ from 'lodash'

const props = defineProps({
  title: {
    Type: String,
    default: '',
  },
  //true일때는 권한이 적용되어서 조회,저장,삭제,추가 이외 버튼은 확장권한에 넣어야지 보임
  //false일때는 권한이 적용 안돼서 모든 버튼이 다 보임
  usePermission: {
    Type: Boolean,
    default: false,
  },
  buttonList: {
    Type: Array,
    default: [],
  },
  hiddenManuel: {
    type: Boolean,
    default: false,
  },
  showManuel: {
    type: Boolean,
    default: false,
  },
})

const getManual = ref(true)
const userStore = useUserStore() //유저정보
const pdfPopup = ref(null)
const showEmp = ref(false)
const contentEmp = ref('')
const buttonItems = ref(initButtonItems(props.buttonList))

const empData1 = reactive({
  KOR_NM: '',
  BSNS_NM: '',
  DEPT_NM: '',
  ASGN_NM: '',
  TEL_NO: '',
  HND_PHN: '',
  JOB_TIT_NM: '',
})

const empData2 = reactive({
  KOR_NM: '',
  BSNS_NM: '',
  DEPT_NM: '',
  ASGN_NM: '',
  TEL_NO: '',
  HND_PHN: '',
  JOB_TIT_NM: '',
})

// watch(() => props.buttonList, newVal => {
//   buttonItems.value = initButtonItems(props.buttonList)
// })

const emit = defineEmits(['click-button'])

const clickButton = (btn) => {
  emit('click-button', btn)
}

const clickManuel = () => {
  pdfPopup.value.openPopup(useLogsStore().fullPath)
}

const disableBtn = (id, disableYn) => {
  let buttonList = getButtonItems()
  let btn = buttonList.find((x) => x.id == id)

  if (btn) {
    btn.disable = disableYn
  }
}

const visibleBtn = (id, visibleYn) => {
  let buttonList = getButtonItems()
  let btn = buttonList.find((x) => x.id == id)

  if (btn) {
    btn.visible = visibleYn
  }
}

const setBtnProperty = (id, propName, value) => {
  let buttonList = getButtonItems()
  let btn = buttonList.find((x) => x.id == id)

  if (btn) {
    btn[propName] = value
  }
}

const getButtonItems = () => {
  return buttonItems.value
}

const getButtonItemsById = (id) => {
  return _.find(buttonItems.value, { id: id }) ? _.find(buttonItems.value, { id: id }) : {}
}

const initEmpData = () => {
  empData1.KOR_NM = ''
  empData1.BSNS_NM = ''
  empData1.DEPT_NM = ''
  empData1.ASGN_NM = ''
  empData1.TEL_NO = ''
  empData1.HND_PHN = ''
  empData1.JOB_TIT_NM = ''
}

defineExpose({
  setBtnProperty,
  getButtonItems,
  disableBtn,
  visibleBtn,
})

watch(
  () => props.showManuel,
  (newValue) => {
    if (props.showManuel) {
      getManual.value = true
    } else {
      getManual.value = false
    }
  }
)

//2025-03-31 김동건 추가
// watch(() => props.buttonList, (newVal) => {
//   buttonItems.value = initButtonItems(newVal);
// }, { immediate: true });

onMounted(async () => {
  const searchParams = reactive({
    CMPNY_DIV: userStore.cmpnyDiv,
    NOTICE_DIV: 'DATCA0070',
    PATH: useLogsStore().fullPath,
  })

  // 이전 화면에서의 담당자 정보 초기화
  initEmpData()

  // 해당 화면 전산 담당자 조회
  await commonSearchApi({ queryId: 'DATCA0070_SEARCH_05', param: searchParams }).then((res) => {
    if (res.ORESULT_CUR.length > 0) {
      empData1.KOR_NM = res.ORESULT_CUR[0].KOR_NM
      empData1.BSNS_NM = res.ORESULT_CUR[0].BSNS_NM
      empData1.DEPT_NM = res.ORESULT_CUR[0].DEPT_NM
      empData1.ASGN_NM = res.ORESULT_CUR[0].ASGN_NM
      empData1.HND_PHN = res.ORESULT_CUR[0].HND_PHN
      empData1.JOB_TIT_NM = res.ORESULT_CUR[0].JOB_TIT_NM

      if (res.ORESULT_CUR[0].TEL_NO != null && res.ORESULT_CUR[0].TEL_NO != '') {
        empData1.TEL_NO = '(' + res.ORESULT_CUR[0].TEL_NO + ')'
      }
    }
    if (empData1.KOR_NM != null && empData1.KOR_NM != '') {
      contentEmp.value = '전산담당 ' + empData1.KOR_NM + ' ' + empData1.TEL_NO
    }
    if (empData2.KOR_NM != null && empData2.KOR_NM != '') {
      if (empData1.KOR_NM != null && empData1.KOR_NM != '') {
        contentEmp.value = contentEmp.value + ' ' + String.fromCharCode(160) + ' '
      }
      contentEmp.value = contentEmp.value + '업무담당 ' + empData2.KOR_NM + ' ' + empData2.TEL_NO
    }
  })

  // 해당 화면 업무 담당자 조회
  await commonSearchApi({ queryId: 'DATCA0070_SEARCH_06', param: searchParams }).then((res) => {
    if (res.ORESULT_CUR.length > 0) {
      empData2.KOR_NM = res.ORESULT_CUR[0].KOR_NM
      empData2.BSNS_NM = res.ORESULT_CUR[0].BSNS_NM
      empData2.DEPT_NM = res.ORESULT_CUR[0].DEPT_NM
      empData2.ASGN_NM = res.ORESULT_CUR[0].ASGN_NM
      empData2.HND_PHN = res.ORESULT_CUR[0].HND_PHN
      empData2.JOB_TIT_NM = res.ORESULT_CUR[0].JOB_TIT_NM

      if (res.ORESULT_CUR[0].TEL_NO != null && res.ORESULT_CUR[0].TEL_NO != '') {
        empData2.TEL_NO = '(' + res.ORESULT_CUR[0].TEL_NO + ')'
      }
    }
    if (empData1.KOR_NM != null && empData1.KOR_NM != '') {
      contentEmp.value = '전산담당 ' + empData1.KOR_NM + ' ' + empData1.TEL_NO
    }
    if (empData2.KOR_NM != null && empData2.KOR_NM != '') {
      if (empData1.KOR_NM != null && empData1.KOR_NM != '') {
        contentEmp.value = contentEmp.value + ' ' + String.fromCharCode(160) + ' '
      }
      contentEmp.value = contentEmp.value + '업무담당 ' + empData2.KOR_NM + ' ' + empData2.TEL_NO
    }
  })

  // 간혹 팝업인데 매뉴얼버튼이 있어야 하는 경우도 있어서...
  if (props.showManuel) return

  // 해당 화면에 매뉴얼이 없을 시 매뉴얼보기 버튼 숨김
  let currentInstance = getCurrentInstance()

  // 탭 또는 팝업일 시 매뉴얼 숨김
  while (currentInstance?.parent) {
    currentInstance = currentInstance.parent
    if (currentInstance.type?.name == 'VWindowItem') {
      getManual.value = false
      return
    } else if (currentInstance.type?.name == 'VDialog') {
      getManual.value = false
      return
    }
  }

  // 담당자가 지정되었으면 메뉴얼이 없어도 물음표 마크가 나오도록 한다.
  if (contentEmp.value != null && contentEmp.value != '') return

  // 로컬, 개발이면 매뉴얼보기 버튼 다 나오게
  if (hostname != 'hises.hd.com') return

  // 해당 화면에 매뉴얼이 없을 시 매뉴얼보기 버튼 숨김
  commonSearchApi({ queryId: 'DATCA0070_SEARCH_04', param: searchParams })
    .then((res) => {
      if (res.ORESULT_CUR.length <= 0) getManual.value = false
    })
    .finally(() => {})
})
</script>

<template>
  <div class="d-flex justify-space-between align-center mb-3" style="min-height: 30px">
    <div class="d-flex">
      <!--<VIcon v-if="title != ''" icon="" />-->
      <span class="menuTitle"> {{ title }} </span>
      <svg-icon
        class="ml-2 manuel-button"
        v-if="!hiddenManuel && getManual"
        name="manuelBtn"
        @click="clickManuel"
        @mouseover="showEmp = true"
        @mouseleave="showEmp = false"
      />
      <div>
        <div v-if="showEmp && contentEmp" class="tooltip ml-2 pl-2 pr-2">
          {{ contentEmp }}
        </div>
      </div>
      <div class="slotText ml-2 mt-1">
        <slot name="editors"></slot>
      </div>
    </div>
    
    <div>
      <VBtn
        v-for="btn in props.buttonList"
        :id="btn"
        :key="`btn_${btn}`"
        v-permission="usePermission && !getButtonItemsById(btn).permission ? [btn] : []"
        v-show="getButtonItemsById(btn).visible"
        :prepend-icon="getButtonItemsById(btn).icon"
        :disabled="getButtonItemsById(btn).disable"
        class="titleBtn"
        @click="clickButton({ id: btn })"
      >
        {{ $t(getButtonItemsById(btn).text) }}
      </VBtn>
      <!-- <VBtn
        v-for="btn in buttonItems"
        :id="btn.id"
        :key="`btn_${btn.id}`"
        v-permission="usePermission && !btn.permission ? [btn.id] : []"
        v-show="btn.visible"
        :prepend-icon="btn.icon"
        :disabled="btn.disable"
        class="titleBtn"
        @click="clickButton(btn)"
      >
        {{ $t(btn.text) }}
      </VBtn> -->
    </div>
    <PdfView ref="pdfPopup" />
  </div>
</template>

<style scoped lang="scss">
.manuel-button {
  cursor: pointer;
}

.manuel-man {
  cursor: pointer;
}

.menuTitle {
  display: flex;
  align-items: center;

}

.tooltip {
  position: absolute;
  background-color: white;
  color: black;
  border-radius: 5px;
  white-space: nowrap;
  z-index: 10;
  border: 2px solid black;
  font-size: 16px;
}
</style>
