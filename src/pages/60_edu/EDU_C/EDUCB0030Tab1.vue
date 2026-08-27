<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import dayjs from 'dayjs'
import { chkEmpty } from '@/utils/common'

defineOptions({
  name:'60_edu-EDU_C-EDUCB0030Tab1',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const dataList = ref([])

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().format('YYYY'),
  QUARTER: Math.ceil(dayjs().format('MM') * 1 / 3) + '',
  BSNS_CD: '',
  DEPT_CD: '',
})

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  QUARTER: [
    { COD: '1', TXT: '1분기', },
    { COD: '2', TXT: '2분기', },
    { COD: '3', TXT: '3분기', },
    { COD: '4', TXT: '4분기', },
  ]
})

const searchBsnsCd = () => {
  commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'N', }, }).then(res => {
    codeList.BSNS_CD = res.ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_CD: '', BSNS_NM: '전체' })
  })
}

const searchDeptCd = (init = true) => {
  commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y', }, }).then(res => {
    codeList.DEPT_CD = res.ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_CD: '', DEPT_NM: '전체' })

    if(init) {
      searchParams.DEPT_CD = ''
    }
  })
}

const beforeSearchMain = () => {
  if(chkEmpty(searchParams.YEAR)) {
    Message.warn(t('년도를 입력해주세요.'))
    return false
  }

  return true
}

const searchDataMain = () => {
  dataList.value = []
  return commonSearchApi({ queryId: 'EDUCB0030_SEARCH_01', param: searchParams })
}

const afterSearchMain = res => {
  dataList.value = res.ORESULT_CUR
}

const onButtonsClick = (btn, showMsg = true) => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setBefore(beforeSearchMain)
      .showMessage(showMsg)
      .setQuery(searchDataMain)
      .setAfter(afterSearchMain)
      .run()
  }
}

onMounted(async () => {
  vm.$nextTick(() => {
    searchBsnsCd()
    searchDeptCd(false)
    onButtonsClick({ id: 'btnSearch' }, false)
  })
})
</script>

<template>
  <div class="h-grow px-2 pt-1 pb-2">
    <v-sheet class="h-auto">
      <IGridTitle
        title="시험요약"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="searchArea">
        <div class="d-flex align-center">
          <i-input
            width="160px"
            :label="$t('년도')"
            type="number"
            :min="1900"
            :max="3000"
            v-model="searchParams.YEAR"
            oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '' )"
            required
          />
          <i-select
            width="160px"
            :label="$t('분기')"
            :items="codeList.QUARTER"
            item-value="COD"
            item-title="TXT"
            v-model="searchParams.QUARTER"
          />
          <i-select
              :label="$t('사업부')"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              width="250px"
              @update:model-value="searchDeptCd"
              />
            <i-select
              :label="$t('부서')"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              width="250px"
            />
        </div>
      </v-sheet>
      <div class="h-grow">
        <v-sheet class="h-auto">
          <template v-for="(item, idx) in dataList" :key="`item_${idx}`">
            <div class="d-flex">
              <div class="d-flex flex-column justify-space-between item-card">
                <div class="d-flex justify-space-between item-wrapper">
                  <div class="d-flex align-center item-title">
                    <span>●</span>총 응시자 수
                  </div>
                  <div class="item-value">
                    {{ item.CNT_ALL }}
                    <span>명</span>
                  </div>
                </div>
                <div class="d-flex justify-space-between item-wrapper">
                  <div class="d-flex align-center item-title">
                    <span>●</span>완료 응시자
                  </div>
                  <div class="item-value">
                    {{ item.CNT_TEST }}
                    <span>명</span>
                  </div>
                </div>
                <div class="d-flex justify-space-between item-wrapper">
                  <div class="d-flex align-center item-title">
                    <span>●</span>미완료 응시자
                  </div>
                  <div class="item-value">
                    {{ item.CNT_NTEST }}
                    <span>명</span>
                  </div>
                </div>
              </div>
              <div class=" flex-column justify-space-between item-card ml-3">
                <div class="d-flex justify-space-between item-wrapper">
                  <div class="d-flex align-center item-title">
                    <span>●</span>총점
                  </div>
                  <div class="item-value">
                    {{ item.TEST_POINT }}
                    <span>점</span>
                  </div>
                </div>
                <div class="d-flex justify-space-between item-wrapper">
                  <div class="d-flex align-center item-title">
                    <span>●</span>최고 득점
                  </div>
                  <div class="item-value">
                    {{ item.TEST_POINT_MAX }}
                    <span>점</span>
                  </div>
                </div>
                <div class="d-flex justify-space-between item-wrapper">
                  <div class="d-flex align-center item-title">
                    <span>●</span>최저 득점
                  </div>
                  <div class="item-value">
                    {{ item.TEST_POINT_MIN }}
                    <span>점</span>
                  </div>
                </div>
                <div class="d-flex justify-space-between item-wrapper">
                  <div class="d-flex align-center item-title">
                    <span>●</span>평균 점수
                  </div>
                  <div class="item-value">
                    {{ item.TEST_POINT_AVG }}
                    <span>점</span>
                  </div>
                </div>
              </div>
              <div class=" flex-column justify-space-between item-card ml-3">
                <div class="d-flex justify-space-between item-wrapper">
                  <div class="d-flex align-center item-title">
                    <span>●</span>응시 기간
                  </div>
                  <div class="item-value">
                    {{ item.TEST_RANGE }}
                  </div>
                </div>
                <div />
              </div>
            </div>
          </template>
        </v-sheet>
      </div>
    </v-sheet>
  </div>
</template>
  
<style scoped lang="scss">
.item-card {
  border: 2px solid #bbddff;
  border-radius: 6px;
  background-color: #fcfcff;

  .item-wrapper {
    margin: 16px;

    .item-title {
      font-size: 20px;
      margin-right: 32px;

      span {
        font-size: 8px;
        margin-right: 8px;
      }
    }

    .item-value {
      font-size: 20px;
      color: #0000dd;

      span {
        color: #000000de;
      }
    }
  }
}
</style>