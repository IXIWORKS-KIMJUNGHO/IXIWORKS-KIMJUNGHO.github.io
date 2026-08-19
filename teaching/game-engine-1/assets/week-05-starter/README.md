# 5주차 상호작용 시작 파일

이 폴더에는 5주차 목표지향 실습에 사용할, 컴파일 가능한 C# 뼈대 파일 네 개가 있습니다.

- `PlayerProgress.cs`: 수집 개수, 필요 개수와 Player의 시작 물리 위치를 관리합니다.
- `Collectible.cs`: Player가 수집 Trigger에 들어온 사건을 처리합니다.
- `HazardZone.cs`: Player의 속도를 멈추고 저장한 시작점으로 돌려보냅니다.
- `GoalZone.cs`: Player가 필요한 수집물을 모두 모았는지 확인합니다.

완성 동작 대신 `TODO`가 적혀 있습니다. 파일 이름은 class 이름과 같게 유지하세요.

## 미션 제약

- Player에는 `PlayerProgress` Component를 하나만 사용합니다.
- 하나의 `Collectible` Prefab으로 정확히 세 Instance를 만듭니다.
- 하나의 `HazardZone` Prefab으로 정확히 두 Instance를 만듭니다.
- `GoalZone` Instance는 하나만 사용합니다.
- 2D 물리 Component만 사용합니다.
- Player Tag와 `TryGetComponent`로 Player를 확인합니다.
- 한 번만 일어나는 상호작용에 `Update`나 `OnTriggerStay2D`를 사용하지 않습니다.
