flowchart TB
Start(["앱 실행"]) --> Login["닉네임 입력"]
Login --> SelectMode{"입장 방식"}
SelectMode -- 방 만들기 --> CreateRoom["방 생성 및 QR/코드 발급"]
SelectMode -- 방 들어가기 --> JoinRoom["QR 스캔 또는 코드 입력"]
CreateRoom --> CheckReady{"대기실: 대기 중"}
JoinRoom --> CheckReady
CheckReady -- 대기 --> CheckReady
CheckReady -- 시작 --> MainScreen[["메인 대시보드"]]
MainScreen --> UserAction{"행동 선택"}
UserAction -- 송금/지불 --> BankType{"거래 유형"}
BankType -- 플레이어에게 --> P2P_Select["상대방 선택"]
P2P_Select --> P2P_Amt["금액 입력"]
P2P_Amt --> P2P_Check{"잔액 확인"}
P2P_Check -- 부족 --> Error1["실패 알림"]
P2P_Check -- 충분 --> P2P_Exec["송금 실행\n(내 현금-, 상대 현금+)"]
BankType -- 은행에게 --> P2B_Type{"지불 목적"}
P2B_Type -- 자산 구매\n(땅/건물) --> BuyAsset["금액 입력"]
BuyAsset --> AssetExec["자산 구매 처리\n(내 현금-, 자산가치+)"]
P2B_Type -- 단순 지출\n(통행료/벌금) --> PayExp["금액 입력"]
PayExp --> ExpExec["지출 처리\n(내 현금-, 자산가치 변동없음)"]
P2B_Type -- 사회복지기금\n기부 --> DonateWel["금액 입력"]
DonateWel --> WelExec["기부 처리\n(내 현금-, 기금+)"]
UserAction -- 사회복지기금 수령 --> CheckFund{"기금 잔액 > 0?"}
CheckFund -- 없음 --> Error2["수령 불가"]
CheckFund -- 있음 --> ReqVote["전체 유저에게 동의 팝업 발송"]
ReqVote --> VoteCheck{"과반수 동의?"}
VoteCheck -- 거절 --> VoteFail["수령 거부됨"]
VoteCheck -- 승인 --> WelRecv["기금 수령 완료(기금 0원, 내 현금+)"]
UserAction -- 월급 받기 --> SalaryBtn["월급 요청 클릭"]
SalaryBtn --> SalaryExec["월급 지급 및 전체 알림(내 현금 +20만)"]
UserAction -- 순위 확인 --> CalcRank["자산 계산\n(현금 + 부동산)"]
CalcRank --> ShowRank["순위 리스트 팝업 표시"]
P2P_Exec --> UpdateUI["화면 갱신"]
AssetExec --> UpdateUI
ExpExec --> UpdateUI
WelExec --> UpdateUI
WelRecv --> UpdateUI
SalaryExec --> UpdateUI
ShowRank --> UpdateUI
Error1 --> UpdateUI
Error2 --> UpdateUI
VoteFail --> UpdateUI
UpdateUI --> MainScreen

    style Start fill:#bbf,stroke:#333,stroke-width:2px
    style MainScreen fill:#f9f,stroke:#333,stroke-width:4px,color:black
    style UserAction fill:#ff9,stroke:#333,stroke-width:2px
    style WelRecv fill:#cfc,stroke:#333,stroke-width:2px
    style SalaryExec fill:#cfc,stroke:#333,stroke-width:2px
