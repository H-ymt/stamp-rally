import { Download, Gift, MapPin, Share2, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const LocationBingo = () => {
	const spots = [
		"渋谷駅",
		"原宿駅",
		"表参道",
		"代々木公園",
		"明治神宮",
		"新宿御苑",
		"東京タワー",
		"六本木",
		"浅草寺",
		"上野公園",
		"秋葉原",
		"スカイツリー",
		"築地市場",
		"豊洲",
		"お台場",
		"銀座",
		"日本橋",
		"皇居",
		"東京駅",
		"品川駅",
		"池袋",
		"中野",
		"吉祥寺",
		"下北沢",
		"自由が丘",
	];

	// URLパラメータから状態を読み込む
	const getInitialState = () => {
		const params = new URLSearchParams(window.location.search);
		const stateParam = params.get("state");

		if (stateParam) {
			try {
				// Base64デコード → 2進数文字列 → boolean配列
				const binaryString = atob(stateParam);
				const visited = binaryString.split("").map((c) => c === "1");
				if (visited.length === 25) {
					return visited;
				}
			} catch (e) {
				console.error("Failed to parse state:", e);
			}
		}

		// デフォルト: 真ん中だけフリー
		const initial = Array(25).fill(false);
		initial[12] = true;
		return initial;
	};

	const getInitialCoupon = () => {
		const params = new URLSearchParams(window.location.search);
		return params.get("coupon") || null;
	};

	const [visited, setVisited] = useState(getInitialState);
	const [coupon, setCoupon] = useState(getInitialCoupon);
	const [showCoupon, setShowCoupon] = useState(false);
	const [newCoupon, setNewCoupon] = useState("");
	const [showConfetti, setShowConfetti] = useState(false);
	const [showShareModal, setShowShareModal] = useState(false);

	// URLを更新する関数
	const updateURL = useCallback(
		(newVisited: boolean[], newCoupon: string | null) => {
			// boolean配列 → 2進数文字列 → Base64エンコード
			const binaryString = newVisited
				.map((v: boolean) => (v ? "1" : "0"))
				.join("");
			const stateParam = btoa(binaryString);

			const params = new URLSearchParams();
			params.set("state", stateParam);
			if (newCoupon) {
				params.set("coupon", newCoupon);
			}

			const newURL = `${window.location.pathname}?${params.toString()}`;
			window.history.replaceState({}, "", newURL);
		},
		[],
	);

	// 状態が変わったらURLを更新
	useEffect(() => {
		updateURL(visited, coupon);
	}, [visited, coupon, updateURL]);

	const generateCoupon = (type: string) => {
		const prefix =
			type === "horizontal" ? "H" : type === "vertical" ? "V" : "D";
		const timestamp = Date.now().toString(36).toUpperCase();
		const random = Math.random().toString(36).substring(2, 10).toUpperCase();
		return `${prefix}-${timestamp}-${random}`;
	};

	const checkBingo = (newVisited: boolean[]) => {
		const lines: Array<{ type: string; index: number }> = [];

		for (let i = 0; i < 5; i++) {
			if (newVisited.slice(i * 5, i * 5 + 5).every((v: boolean) => v)) {
				lines.push({ type: "horizontal", index: i });
			}
		}

		for (let i = 0; i < 5; i++) {
			if ([0, 1, 2, 3, 4].every((j) => newVisited[j * 5 + i])) {
				lines.push({ type: "vertical", index: i });
			}
		}

		if ([0, 6, 12, 18, 24].every((i) => newVisited[i])) {
			lines.push({ type: "diagonal", index: 0 });
		}

		if ([4, 8, 12, 16, 20].every((i) => newVisited[i])) {
			lines.push({ type: "diagonal", index: 1 });
		}

		return lines;
	};

	const handleVisit = (index: number) => {
		if (index === 12) return;

		const scrollPosition = window.scrollY;

		const newVisited = [...visited];
		newVisited[index] = !newVisited[index];

		const oldLines = checkBingo(visited);
		const newLines = checkBingo(newVisited);

		setVisited(newVisited);

		if (newLines.length > oldLines.length && newVisited[index] && !coupon) {
			const newBingoLines = newLines.filter(
				(nl) =>
					!oldLines.some((ol) => ol.type === nl.type && ol.index === nl.index),
			);

			if (newBingoLines.length > 0) {
				const newCouponCode = generateCoupon(newBingoLines[0].type);
				setCoupon(newCouponCode);
				setNewCoupon(newCouponCode);
				setShowCoupon(true);
				setShowConfetti(true);
				setTimeout(() => setShowConfetti(false), 3000);
			}
		}

		requestAnimationFrame(() => {
			window.scrollTo(0, scrollPosition);
		});
	};

	const resetGame = () => {
		if (window.confirm("ゲームをリセットしますか?")) {
			const initial = Array(25).fill(false);
			initial[12] = true;
			setVisited(initial);
			setCoupon(null);
			window.history.replaceState({}, "", window.location.pathname);
		}
	};

	const shareProgress = () => {
		setShowShareModal(true);
	};

	const copyURL = () => {
		const url = window.location.href;
		navigator.clipboard.writeText(url).then(() => {
			alert("URLをコピーしました!");
			setShowShareModal(false);
		});
	};

	const generateQRCode = () => {
		const url = window.location.href;
		const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
		window.open(qrCodeURL, "_blank");
	};

	const visitedCount = visited.filter((v) => v).length;
	const progress = ((visitedCount / 25) * 100).toFixed(0);

	return (
		<div className="px-4 py-6 min-h-screen">
			<div className="mx-auto max-w-2xl">
				<div className="mb-6 text-center">
					<h1 className="flex justify-center items-center gap-2 mb-2 font-bold text-blue-600 text-2xl">
						<MapPin className="text-blue-500" />
						東京観光ビンゴ
					</h1>
					<p className="text-gray-600">スポットを訪れてビンゴを揃えよう!</p>
				</div>

				<div className="bg-white shadow-sm mb-6 p-6 rounded-lg">
					<div className="flex justify-between items-center mb-4">
						<div className="flex items-center gap-4">
							<div className="text-center">
								<div className="font-bold text-blue-600 text-2xl">
									{visitedCount}/25
								</div>
								<div className="text-gray-500 text-xs">訪問済み</div>
							</div>
							{/* <div className="text-center">
								<div className="font-bold text-blue-600 text-2xl">
									{bingoCount}
								</div>
								<div className="text-gray-500 text-xs">ビンゴ</div>
							</div> */}
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={shareProgress}
								className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white text-sm"
							>
								<Share2 size={16} />
								共有
							</button>
							<button
								type="button"
								onClick={resetGame}
								className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm"
							>
								リセット
							</button>
						</div>
					</div>

					<div className="bg-gray-200 mb-2 rounded-full w-full h-3">
						<div
							className="bg-gradient-to-r from-blue-500 to-blue-900 rounded-full h-3 transition-all duration-500"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<div className="text-gray-600 text-sm text-right">{progress}%</div>
				</div>

				<div className="gap-2 grid grid-cols-5 mb-6">
					{spots.map((spot, index) => (
						<button
							key={`spot-${spot}`}
							type="button"
							onClick={() => handleVisit(index)}
							className={`
                aspect-square rounded-lg p-2 text-xs font-medium transition-all duration-300
                ${
									visited[index]
										? "bg-gradient-to-br from-blue-500 to-blue-800 text-white shadow-lg scale-95"
										: "bg-white text-gray-700 bg-gradient-to-br border border-blue-100 from-white to-blue-50/100 shadow-md hover:shadow-lg hover:scale-105"
								}
                ${index === 12 && !visited[index] ? "bg-yellow-100 border-2 border-yellow-400" : ""}
                flex items-center justify-center text-center leading-tight
              `}
						>
							{index === 12 && !visited[index] ? (
								<div>
									<div className="font-bold text-yellow-600">FREE</div>
									<div className="text-xs">{spot}</div>
								</div>
							) : (
								<div className="flex flex-col items-center gap-1">
									{visited[index] && <Trophy size={14} />}
									<span>{spot}</span>
								</div>
							)}
						</button>
					))}
				</div>

				{coupon && (
					<div className="bg-white mt-12 rounded-lg">
						<h2 className="flex items-center gap-2 mb-4 font-bold text-xl">
							<Gift />
							獲得クーポン
						</h2>
						<div className="bg-gradient-to-r from-blue-100 to-blue-100 p-4 rounded-lg">
							<div className="mb-1 text-gray-600 text-sm">
								ビンゴ達成クーポン
							</div>
							<div className="font-mono font-bold text-blue-700 text-2xl">
								{coupon}
							</div>
							<div className="mt-2 text-gray-500 text-xs">
								※店舗でこのコードを提示してください
							</div>
						</div>
					</div>
				)}

				{showCoupon && (
					<div className="z-40 fixed inset-0 flex justify-center items-center bg-black/60 bg-opacity-50 p-4">
						<div className="bg-white p-8 rounded-2xl w-full max-w-md text-center">
							<div className="mb-4 text-6xl">🎉</div>
							<h3 className="mb-4 font-bold text-blue-600 text-2xl">
								ビンゴ達成!
							</h3>
							<p className="mb-4 text-gray-600">クーポンをゲットしました!</p>
							<div className="bg-gradient-to-r from-blue-100 to-blue-100 mb-6 p-4 rounded-lg">
								<div className="font-mono font-bold text-blue-700 text-3xl">
									{newCoupon}
								</div>
							</div>
							<button
								type="button"
								onClick={() => setShowCoupon(false)}
								className="bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg px-6 py-3 rounded-lg font-bold text-white transition-all"
							>
								閉じる
							</button>
						</div>
					</div>
				)}

				{showConfetti && (
					<div className="z-30 fixed inset-0 pointer-events-none">
						<div className="flex justify-center items-start w-full h-full">
							<div className="mt-10 text-4xl animate-bounce">🎊</div>
						</div>
					</div>
				)}

				{showShareModal && (
					<div className="z-40 fixed inset-0 flex justify-center items-center bg-black/60 bg-opacity-50 p-4">
						<div className="bg-white p-8 rounded-2xl w-full max-w-md">
							<h3 className="mb-4 font-bold text-blue-600 text-2xl">
								進捗を共有
							</h3>
							<p className="mb-6 text-gray-600">
								このURLで進捗状態を保存・共有できます
							</p>

							<div className="bg-gray-100 mb-4 p-3 rounded-lg text-sm break-all">
								{window.location.href}
							</div>

							<div className="flex flex-col gap-3">
								<button
									type="button"
									onClick={copyURL}
									className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg w-full font-bold text-white transition-all"
								>
									URLをコピー
								</button>
								<button
									type="button"
									onClick={generateQRCode}
									className="flex justify-center items-center gap-2 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg w-full font-bold text-white transition-all"
								>
									<Download size={20} />
									QRコード生成
								</button>
								<button
									type="button"
									onClick={() => setShowShareModal(false)}
									className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg w-full font-bold text-gray-700 transition-all"
								>
									閉じる
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default LocationBingo;
