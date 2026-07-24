// test-highlight.c — 测试 C 语言语法高亮和折叠
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_USERS 100
#define MAX_NAME_LEN 50

typedef struct {
    char name[MAX_NAME_LEN];
    int age;
    double score;
} User;

/* 用户数据库 — 中文注释测试 */
static User users[MAX_USERS];
static int user_count = 0;

/**
 * 添加用户
 * @param name 用户名 — 中文参数注释
 * @param age 年龄
 * @return 1=成功 0=失败
 */
int add_user(const char* name, int age) {
    if (user_count >= MAX_USERS) {
        fprintf(stderr, "用户数量已达上限！\n");
        return 0;
    }

    strncpy(users[user_count].name, name, MAX_NAME_LEN - 1);
    users[user_count].age = age;
    users[user_count].score = 0.0;
    user_count++;

    printf("添加用户: %s, 年龄: %d\n", name, age);
    return 1;
}

/* 计算平均年龄 — 中文注释 */
double calc_avg_age(void) {
    if (user_count == 0) return 0.0;

    int total = 0;
    for (int i = 0; i < user_count; i++) {
        total += users[i].age;
    }
    return (double)total / user_count;
}

/* 查找最年长用户 — 中文注释 */
User* find_oldest(void) {
    if (user_count == 0) return NULL;

    User* oldest = &users[0];
    for (int i = 1; i < user_count; i++) {
        if (users[i].age > oldest->age) {
            oldest = &users[i];
        }
    }
    return oldest;
}

int main(void) {
    add_user("Alice", 25);
    add_user("Bob", 30);
    add_user("Charlie", 22);

    printf("平均年龄: %.1f\n", calc_avg_age());

    User* oldest = find_oldest();
    if (oldest) {
        printf("最年长用户: %s\n", oldest->name);
    }

    return 0;
}
