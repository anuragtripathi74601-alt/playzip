import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/game_service.dart';
import '../../app.dart';

class FriendsScreen extends StatefulWidget {
  const FriendsScreen({super.key});

  @override
  State<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends State<FriendsScreen> {
  final _service = PlayZipApp.gameService;
  final _searchController = TextEditingController();

  // Demo friends
  final List<Map<String, String>> _allFriends = [
    {'id': 'f1', 'name': 'Rahul Sharma', 'phone': '9876543210', 'status': 'Online', 'avatar': 'R'},
    {'id': 'f2', 'name': 'Amit Kumar', 'phone': '8765432109', 'status': 'Playing', 'avatar': 'A'},
    {'id': 'f3', 'name': 'Priya Singh', 'phone': '7654321098', 'status': 'Offline', 'avatar': 'P'},
    {'id': 'f4', 'name': 'Vikram Patel', 'phone': '6543210987', 'status': 'Online', 'avatar': 'V'},
  ];

  List<Map<String, String>> _filteredFriends = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _service.addListener(() => setState(() {}));
    _filteredFriends = List.from(_allFriends);
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _service.removeListener(() {});
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _searchController.text.toLowerCase();
      if (_searchQuery.isEmpty) {
        _filteredFriends = List.from(_allFriends);
      } else {
        _filteredFriends = _allFriends.where((f) =>
          f['name']!.toLowerCase().contains(_searchQuery) ||
          f['phone']!.contains(_searchQuery)
        ).toList();
      }
    });
  }

  void _showAddFriendDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.darkSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Add Friend', style: TextStyle(color: Colors.white)),
        content: TextField(
          controller: controller,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Enter PlayZip ID or phone',
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              _service.addFriend(controller.text);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Friend added!'), backgroundColor: Colors.green),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentColor),
            child: const Text('Add', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _inviteFriend(Map<String, String> friend, String game) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Invited ${friend['name']} to play $game!'), backgroundColor: AppTheme.accentColor),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppTheme.primaryColor, AppTheme.darkSurface],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
                    const Spacer(),
                    const Text('Friends', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.person_add, color: Colors.white),
                      onPressed: _showAddFriendDialog,
                    ),
                  ],
                ),
              ),

              // Search
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Icon(Icons.search, color: Colors.white.withOpacity(0.4)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          border: InputBorder.none,
                          hintText: 'Search friends...',
                          hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Online count
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    Text('${_allFriends.where((f) => f['status'] == 'Online').length} Online',
                        style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13)),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Friends list
              Expanded(
                child: _filteredFriends.isEmpty
                    ? Center(child: Text('No friends found', style: TextStyle(color: Colors.white.withOpacity(0.4))))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _filteredFriends.length,
                        itemBuilder: (ctx, i) {
                          final f = _filteredFriends[i];
                          final isOnline = f['status'] == 'Online';
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Row(
                              children: [
                                Stack(
                                  children: [
                                    CircleAvatar(
                                      radius: 22,
                                      backgroundColor: AppTheme.accentColor.withOpacity(0.3),
                                      child: Text(f['avatar']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                                    ),
                                    Positioned(
                                      bottom: 0, right: 0,
                                      child: Container(
                                        width: 12, height: 12,
                                        decoration: BoxDecoration(
                                          color: isOnline ? Colors.green : Colors.grey,
                                          shape: BoxShape.circle,
                                          border: Border.all(color: AppTheme.darkSurface, width: 2),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(f['name']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                                      Row(
                                        children: [
                                          Container(
                                            width: 6, height: 6,
                                            decoration: BoxDecoration(
                                              color: isOnline ? Colors.green : Colors.grey,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          Text(f['status']!, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                PopupMenuButton<String>(
                                  icon: Icon(Icons.play_arrow, color: AppTheme.accentColor),
                                  color: AppTheme.darkSurface,
                                  onSelected: (game) => _inviteFriend(f, game),
                                  itemBuilder: (_) => [
                                    const PopupMenuItem(value: 'chess', child: ListTile(leading: Text('♟', style: TextStyle(fontSize: 20)), title: Text('Chess', style: TextStyle(color: Colors.white)), dense: true)),
                                    const PopupMenuItem(value: 'pool', child: ListTile(leading: Text('🎱', style: TextStyle(fontSize: 20)), title: Text('Pool', style: TextStyle(color: Colors.white)), dense: true)),
                                    const PopupMenuItem(value: 'snooker', child: ListTile(leading: Text('🔴', style: TextStyle(fontSize: 20)), title: Text('Snooker', style: TextStyle(color: Colors.white)), dense: true)),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
