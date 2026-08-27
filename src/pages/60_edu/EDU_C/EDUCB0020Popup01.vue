<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'

const emit = defineEmits(['close'])

defineOptions({
})

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const t = useI18n().t
const gridTitle = ref(null)
const popupTitle = ref('')
const testItem = ref([])
const answItem = ref([])
const answCnt = ref(0)
const totalCnt = ref(0)
const isSubmit = ref(false)
const testTime = ref(0)
const iTestTime = ref(null)
const testStart = ref(null)

const dialog = ref(false)

const onButtonsClick = btn => {
  if(btn.id === 'btnUpdate') {
    for(let i = 0; i < answItem.value.length; i++) {
      if(!_.some(answItem.value[i], row => row.CHK_YN === 'Y')) {
        Message.warn(t(`${i + 1}번 문항의 답을 선택해주세요.`))
        return
      }
    }

    vm.$swal({
      title: t('답안지를 제출 하시겠습니까?'),
      showCancelButton: true,
    }).then(confirmRes => {
      if (confirmRes.isConfirmed) {
        const sumbitParams = answItem.value.flat()

        sumbitParams.forEach(row => { row.IS_LAST = 'N' })
        sumbitParams[sumbitParams.length - 1].IS_LAST = 'Y'

        commonExecuteApi({ queryId : 'EDUCB0020_SAVE_02', list: sumbitParams }).then(res => {
          isSubmit.value = true
          Message.success(t('제출되었습니다.'))
          onClose()
        })
      }
    })
  }
  else if(btn.id === 'btnClose'){
    onClose()
  }
}

const onClose = () => {
  if(iTestTime.value != null) {
    clearInterval(iTestTime.value)
  }
  
  dialog.value = false
  emit('close', isSubmit.value)
}

const clearPopup = () => {
  isSubmit.value = false
  testItem.value = []
  answItem.value = []
  answCnt.value = 0
  totalCnt.value = 0
  testTime.value = 0
  testStart.value = null
}

const openPopup = data => {
  clearPopup()

  commonSearchApi({ queryId : 'EDUCB0020_SEARCH_02', param: data }).then(res => {
    const mainData = res.ORESULT_CUR1[0]
    const detailData = res.ORESULT_CUR2
    
    popupTitle.value = `안전역량 평가 문제지(${mainData.CHK_JIC_NM} - ${mainData.CHK_EQUIP_NM})`
    answCnt.value = 0
    totalCnt.value = mainData.TEST_CNT
    testStart.value = new Date(mainData.TEST_START_DATE)

    testItem.value = _.uniqBy(
      detailData.map(row => {
        return { TEST_ITEM: row.TEST_ITEM, TEST_DESC: row.TEST_DESC }
      }),
      'TEST_ITEM'
    )

    testItem.value.forEach(rowTest => {
      answItem.value.push(_.filter(detailData, rowAnsw => { return rowAnsw.TEST_ITEM === rowTest.TEST_ITEM }))
    })

    dialog.value = true

    testTime.value = Math.floor(((new Date()).getTime() - testStart.value.getTime()) / (1000 * 60))
    iTestTime.value = setInterval(
      () => {
        testTime.value = Math.floor(((new Date()).getTime() - testStart.value.getTime()) / (1000 * 60))
      },
      1000 * 60
    )
  })
}

const toggleRadio = (arr, idx) => {
  for(let i = 0; i < arr.length; i++) {
    if(i !== idx) {
      arr[i].CHK_YN = 'N'
    }
  }

  answCnt.value = _.filter(answItem.value.flat(), row => row.CHK_YN === 'Y').length
}

onMounted(() => {
  nextTick(() => {
    gridTitle.value.setBtnProperty('btnUpdate', 'text', '제출')
  })
})

defineExpose({
  openPopup,
})
</script>


<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="850"
    max-height="100vh"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5"
    >
      <span>시험 응시 팝업</span>
    </v-sheet>
    <div class="fill-height d-flex flex-column popup-main pa-3 rounded-b-5">
      <IGridTitle
        ref="gridTitle"
        :title="popupTitle"
        :button-list="['btnUpdate', 'btnClose']"
        @click-button="onButtonsClick"
      />
      <div class="popup-progress d-flex justify-space-between align-center px-2 pb-1">
        <div class="d-flex align-center">
          <div class="title pr-2">
            경과 시간 :
          </div>
          <div class="slash">
            {{ `${testTime}분` }}
          </div>
        </div>
        <div class="d-flex align-center">
          <div class="title pr-2">
            진행 상태 :
          </div>
          <div class="answ-cnt" :style="{ color: answCnt < totalCnt ? '#ff5353': '#0681fd' }">
            {{ answCnt }}
          </div>
          <div class="slash px-1">
            /
          </div>
          <div class="total-cnt">
            {{ totalCnt }}
          </div>
        </div>
      </div>
      <div class="popup-body overflow-y-auto pa-5">
        <div
          v-for="(rowTest, idxTest) in testItem"
          :key="rowTest.TEST_ITEM"
          class="test-item__card px-4 py-3"
          :class="[idxTest > 0 ? 'mt-4' : '']"
        >
          <div class="test-item font-weight-bold">
            {{ `${idxTest + 1}. ${rowTest.TEST_DESC}` }}
          </div>
          <div class="answ-item__body px-2">
            <v-radio-group
              v-for="(rowAnsw, idxAnsw) in answItem[idxTest]"
              :key="`${rowAnsw.TEST_ITEM}-${rowAnsw.ANSW_ITEM}`"
              v-model="rowAnsw.CHK_YN"
              class="mt-2 answ-item"
            >
              <v-radio
                :label="rowAnsw.ANSW_DESC"
                true-value="Y"
                false-value="N"
                @input="toggleRadio(answItem[idxTest], idxAnsw)"
              />
            </v-radio-group>
          </div>
        </div>
      </div>
    </div>
  </VDialog>
</template>
    

<style scoped lang="scss">
.popup-main {
  background-color: #ffffff;
  
  .popup-progress {
    height: 40px;

    .title {
      font-size: 20px;
    }

    .answ-cnt {
      font-size: 28px;
    }

    .slash {
      font-size: 28px;
    }

    .total-cnt {
      font-size: 28px;
      color: #0681fd;
    }
  }

  .popup-body {
    height: calc(100vh - 50px - 52px - 40px - 24px);
    background-color: #f0f0f0;
    border-radius: 5px;

    .test-item__card {
      background-color: #ffffff;
      border-radius: 5px;
    }

    .answ-item:hover {
      background-color: #fff2cc;
    }
  }
}
</style>