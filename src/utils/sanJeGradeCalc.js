//산재 장해등급 금액 가져오는 함수
import { useUserStore } from "@hiway/stores/user"
import { commonSearchApi } from "@/@hiway/api/commonApi"
import dayjs from "dayjs"

const userStore = useUserStore() //유저정보
//const firstOccurStandard = dayjs("2006-01-01", "YYYY-MM-DD")

//산재구분,재해일자,장해등급판정일
/*
일반사고 : A
난청 : N
진폐 : Z
중대재해 : J
근골격계 : G
*/

export default function gradeCalculator(param) {
  const firstOccurStandard = new Date("2006-01-01")
  const secondOccurStandard = new Date("2012-06-01")
  const thirdOccurStandard = new Date("2014-06-01")
  const fourthOccurStandard = new Date("2025-01-01")
  const SANGBN = param.SANGBN
  const OCCURDATE = new Date(param.OCCURDATE) //재해발생일자
  const RATINGDTE = new Date(param.RATINGDTE) //장해등급판정일

  
  if (SANGBN === "A" || SANGBN === "N") {

    /* *** 장해등급판정일이 2014.06.01 이후면 장해등급판정일 기준으로 *** */
    if (RATINGDTE >= thirdOccurStandard && RATINGDTE < fourthOccurStandard){
      //산재구분이 일반사고,난청이고 장해등급판정일이 2014.06.01~2024.12.31일때
      const ALL_UP_CD = "HHIB25004104"
      let result = searchGradeAmt(ALL_UP_CD)
      return result
    } else if (RATINGDTE >= fourthOccurStandard){
      //산재구분이 일반사고,난청이고 장해등급판정일이 2025.01.01일 이후일때
      const ALL_UP_CD = "HHIB25004105"
      let result = searchGradeAmt(ALL_UP_CD)
      return result
    } else {

      /* *** 장해등급판정일이 2014.06.01 이전이면 재해발생일 기준으로 *** */
      //산재구분이 일반사고,난청인 경우
      if (firstOccurStandard > OCCURDATE) {
        //산재구분이 일반사고,난청이고 재해발생일이 2006.01.01일 이전일때
        const ALL_UP_CD = "HHIB25004101"
        let result = searchGradeAmt(ALL_UP_CD)
        return result
      } else if (OCCURDATE >= firstOccurStandard && OCCURDATE < secondOccurStandard) {
        //산재구분이 일반사고,난청이고 재해발생일이 2006.01.01~2012.06.01일때
        const ALL_UP_CD = "HHIB25004102"
        let result = searchGradeAmt(ALL_UP_CD)
        return result
      } else if (OCCURDATE >= secondOccurStandard && OCCURDATE < thirdOccurStandard) {
        //산재구분이 일반사고,난청이고 재해발생일이 2012.06.01~2014.06.01일때
        const ALL_UP_CD = "HHIB25004103"
        let result = searchGradeAmt(ALL_UP_CD)
        return result
      }
    }

    // //산재구분이 일반사고,난청인 경우
    // if (firstOccurStandard > OCCURDATE) {
    //   //산재구분이 일반사고,난청이고 재해발생일이 2006.01.01일 이전일때
    //   const ALL_UP_CD = "HHIB25004101"
    //   let result = searchGradeAmt(ALL_UP_CD)
    //   return result
    // } else if (OCCURDATE > firstOccurStandard && OCCURDATE < secondOccurStandard) {
    //   //산재구분이 일반사고,난청이고 재해발생일이 2006.01.01~2012.06.01일때
    //   const ALL_UP_CD = "HHIB25004102"
    //   let result = searchGradeAmt(ALL_UP_CD)
    //   return result
    // } else if (OCCURDATE > secondOccurStandard && OCCURDATE < thirdOccurStandard) {
    //   //산재구분이 일반사고,난청이고 재해발생일이 2012.06.01~2014.06.01일때
    //   const ALL_UP_CD = "HHIB25004103"
    //   let result = searchGradeAmt(ALL_UP_CD)
    //   return result
    // } else if (OCCURDATE > thirdOccurStandard && OCCURDATE < fourthOccurStandard) {      
    //   //산재구분이 일반사고,난청이고 재해발생일이 2014.06.01일 이후일때
    //   const ALL_UP_CD = "HHIB25004104"
    //   let result = searchGradeAmt(ALL_UP_CD)
    //   return result
    // } else {
    //   //산재구분이 일반사고,난청이고 재해발생일이 2025.01.01일 이후일때
    //   const ALL_UP_CD = "HHIB25004105"
    //   let result = searchGradeAmt(ALL_UP_CD)
    //   return result
    // }
  }

  if (SANGBN === "Z") {
    //산재구분이 진폐일때
    if (firstOccurStandard > OCCURDATE) {
      //산재구분이 진폐이고 재해발생일이 2006.01.01일 이전일때
      const ALL_UP_CD = "HHIB25004101"
      let result = searchGradeAmt(ALL_UP_CD)
      return result
    } else if (OCCURDATE >= firstOccurStandard && OCCURDATE < thirdOccurStandard) {
      //산재구분이 진폐이고 재해발생일이 2006.01.01 ~ 2014.06.01일때
      const ALL_UP_CD = "HHIB25004102"
      let result = searchGradeAmt(ALL_UP_CD)
      return result
    } else if (OCCURDATE >= thirdOccurStandard && OCCURDATE < fourthOccurStandard) {
      //산재구분이 진폐이고 재해발생일이 2014.06.01이후일때
      const ALL_UP_CD = "HHIB25004104"
      let result = searchGradeAmt(ALL_UP_CD)
      return result
    } else {
      //산재구분이 진폐이고 재해발생일이 2025.01.01이후일때
      const ALL_UP_CD = "HHIB25004105"
      let result = searchGradeAmt(ALL_UP_CD)
      return result
    }
  }
}

const searchGradeAmt = (ALL_UP_CD) => {
  return commonSearchApi({
    queryId: "searchCommonCodeF",
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      ALL_UP_CD: ALL_UP_CD,
      USE_FLAG: "Y",
    },
  })
}
