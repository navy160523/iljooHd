<!--
  화면명 : 업무상질병 사업주조사서
  화면개요 : 업무상질병 사업주 조사서
-->
<script setup>
import { ref, computed } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useUserStore } from '@hiway/stores/user'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import dayjs from 'dayjs'

const menuTitle = ref(null)
const userStore = useUserStore()
const emit = defineEmits(['btnPrev', 'btnNext', 'btnCloseClick','btnUpdate'])

const props = defineProps({ searchParams: Object }) // props 객체를 직접 사용

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    emit('btnCloseClick')
  } else if (btn.id === 'btnPrev') {
    emit('btnPrev')
  } else if (btn.id === 'btnNext') {
    emit('btnNext')
  } else if (btn.id === 'btnUpdate') {
    emit('btnUpdate')
  }
}

// 근무일수 계산
const getWorkDate = computed(() => {
  const joinDate = dayjs(props.searchParams.COM_ENT_DATE, 'YYYY-MM-DD') // 입사일
  const resignDate = dayjs(props.searchParams.RETI_DATE || dayjs()) // 퇴직/휴직일
  // 총 근무 연수 계산
  const years = resignDate.diff(joinDate, 'year')
  // 남은 개월 수 계산
  const months = resignDate.diff(joinDate.add(years, 'year'), 'month')
  // 결과 문자열 반환
  return `${years}년 ${months}개월`
})

// 만 나이 구하기
const getAge = computed(() => {
  // 생년월일을 dayjs 객체로 생성
  const birthDate = dayjs(props.searchParams.BIRTH_DAY, 'YYYY-MM-DD')
  // 현재 날짜를 dayjs 객체로 생성
  const currentDate = dayjs()
  // 전체 연도 차이 계산
  const fullYearDifference = currentDate.diff(birthDate, 'year')
  // 올해 생일 날짜 계산
  const thisYearsBirthday = birthDate.add(fullYearDifference, 'year')
  // 생일이 지났는지 여부 확인
  const hasBirthdayPassed = !currentDate.isBefore(thisYearsBirthday)
  // 실제 나이 계산
  return hasBirthdayPassed ? fullYearDifference : fullYearDifference - 1
})

const getData = () => {
  return { REMARK: props.searchParams.REMARK }
}

onMounted(() => {
})

defineExpose({
  getData
})
</script>

<template>
  <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move">
    <span>직력확인서</span>
  </v-sheet>
  <v-card class="pa-0 fill-height rounded-b-5">
    <IGridTitle 
      :button-list="['btnNext', 'btnClose']" 
      @click-button="onButtonsClick" 
      class="mt-2 mr-2"
    ></IGridTitle>
    <v-card-text class="pa-2 pt-0 content-area">
      <div>
        <table class="w-100">
          <tbody>
              <tr>
                <td class="title-text1 pa-2" colspan=7>직력확인서</td>
              </tr>
              <tr>
                <td class="left-cell title-text2">성명</td>
                <td>{{ props.searchParams.EMP_NM }}</td>
                <td class="title-text2">생년월일</td>
                <td colspan=3> {{ dayjs(props.searchParams.BIRTH_DAY).format('YYYY년 MM월 DD일') }}</td>
              </tr>
              <tr>
                <td class="left-cell title-text2">만 나이</td>
                <td>{{ getAge }}</td>
                <td class="title-text2">입사일</td>
                <td colspan=3>{{ dayjs(props.searchParams.COM_ENT_DATE).format('YYYY년 MM월 DD일') }}</td>
              </tr>
              <tr>
                <td class="left-cell title-text2">직위</td>
                <td>{{ props.searchParams.JOB_TIT_NM }}</td>
                <td class="title-text2">휴직일/퇴직일</td>
                <td colspan=1>{{ props.searchParams.HLD_OFFI_GBN }}</td>
                <td colspan=2>{{ props.searchParams.HLD_OFFI_GBN == '재직' ? ' ' : props.searchParams.RETI_DATE }}</td>
              </tr>
              <tr> 
                <td class="left-cell title-text2">직무</td>
                <td>{{ props.searchParams.STD_DUTY_NM }}</td>
                <td class="title-text2">현 직장 경력</td>
                <td colspan=3>{{ getWorkDate }}</td>
              </tr>
              <tr style="height:300px;">
                <td class="left-cell title-text2">현재까지 기간별 수행업무</td>
                <td colspan=5></td>
              </tr>
              <tr>
                <td class="left-cell title-text2">비고</td>
                <td colspan=5>
                  <i-textarea
                    v-model="props.searchParams.REMARK"
                    width="100%"
                  />
                </td>
              </tr>
              <tr>
                <td class="title-text2" colspan=6>위의 기재 내용이 틀림없음을 확인합니다.</td>
              </tr>
              <tr>
                <td class="left-cell title-text2" rowspan=3>확인</td>
                <td class="title-text2">작성일자</td>
                <td colspan=4>{{ dayjs().format('YYYY년 MM월 DD일') }}</td>
              </tr>
              <tr>
                <td class="title-text2">근로자 명</td>
                <td colspan=4>{{ searchParams.EMP_NM }}</td>
              </tr>
              <tr>
                <td class="title-text2">사용자 명</td>
                <td colspan=4>에이치디현대중공업 주식회사</td>
              </tr>
          </tbody>
        </table>
      </div> 
    </v-card-text>
  </v-card>
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
th {
  padding: 6px;
  border: 1px solid #ccc;
  background-color: #f4f5f9;
}

td {
  padding: 6px;
  font-weight: 400;
  border: 1px solid #ccc;
  text-align: center;
  width:180px;
  font-size: 16px;
}

.left-cell {
  width: 150px;
  font-weight: bold;
}
.title-text1 {
  font-weight: bold;
  font-size: 28px;
  background-color: #e4e4e4;
}
.title-text2 {
  font-weight: bold;
  font-size: 18px;
  background-color: #e4e4e4;
}
.cell-in-input {
  display: inline-block;
  vertical-align: middle;
}
</style>

